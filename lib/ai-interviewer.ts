import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { interviewLevels, interviewTracks, type InterviewLevelKey, type InterviewTrackKey } from "@/lib/interviews";

export const INTERVIEW_MODEL = "claude-opus-5-5";

// Retries a turn on Anthropic's recommended fallback model if a safety classifier declines it.
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/** Caps that keep a single interview's cost bounded. */
export const MAX_CANDIDATE_MESSAGES = 40;
export const MAX_MESSAGE_CHARS = 6000;

const DEFAULT_DAILY_INTERVIEW_LIMIT = 2;

/** New AI interviews each user may start per IST day (admins are exempt). Set AI_INTERVIEWS_PER_DAY to change it. */
export function dailyInterviewLimit() {
  const configured = Number(process.env.AI_INTERVIEWS_PER_DAY);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_DAILY_INTERVIEW_LIMIT;
}

/** Sent as the first (hidden) user turn, since a conversation must start with a user message. */
export const OPENING_PROMPT = "I'm ready. Please begin the interview.";

export type TranscriptMessage = {
  role: "user" | "assistant";
  content: string;
  /** Not shown in the chat UI (the opening prompt). */
  hidden?: boolean;
};

let client: Anthropic | null = null;

/** Null when no Anthropic credentials are configured, so routes can return a clear error. */
export function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return null;
  }
  client ??= new Anthropic();
  return client;
}

const trackGuidance: Record<InterviewTrackKey, string> = {
  DSA: `Run a coding interview. Present a problem suited to the candidate's level with a clear statement, one or two examples, and constraints. Ask them to clarify the problem and explain their approach before writing code, then to write the code in a language of their choice, then to analyse time and space complexity and walk through edge cases. If time allows, move to a follow-up variation or a second problem. Point out bugs by asking them to trace an input rather than by fixing the code yourself.`,
  SYSTEM_DESIGN: `Run a system design interview around one design problem whose scope fits the candidate's level (for example, a URL shortener or rate limiter for juniors; a news feed, chat system, or video platform for seniors). Let the candidate drive. Expect them to gather functional and non-functional requirements, make rough capacity estimates, define the API and data model, sketch a high-level architecture, and then go deep on one or two components. Push on bottlenecks, failure modes, consistency, and trade-offs. Interrupt with a changed requirement at least once to see how they adapt.`,
  DEVELOPMENT: `Run a practical software development interview. Start by asking about their primary language, stack, and a project they're proud of, then tailor the rest to that stack. Cover a mix of: language and runtime fundamentals, API design, databases and data modelling, debugging a realistic production issue, testing strategy, and reviewing a short code snippet you write that contains a few deliberate problems. Ask follow-ups that reveal whether they understand why, not just what.`,
};

export function buildInterviewerPrompt(track: InterviewTrackKey, level: InterviewLevelKey) {
  const trackInfo = interviewTracks[track];
  const levelInfo = interviewLevels[level];

  return `You are an experienced engineering interviewer at a product company, conducting a ${levelInfo.label.toLowerCase()} (${levelInfo.description} experience) ${trackInfo.name} mock interview on an interview-practice platform. The candidate is practising for real interviews, so behave like a realistic, professional, and fair interviewer: warm but rigorous, and calibrated to their level.

${trackGuidance[track]}

How to conduct the conversation:
- Ask one question at a time and wait for the candidate's answer. Keep each message short and conversational, the way you would speak in a live interview; use Markdown code blocks only for code, inputs, or outputs.
- Don't hand over solutions. When the candidate is stuck, give the smallest useful hint, as a real interviewer would, and let them continue.
- Probe their answers: ask why, ask about alternatives, complexity, edge cases, and trade-offs.
- Don't score the candidate or give detailed feedback during the interview; a separate written report covers that after they finish.
- The interview is about 45 minutes long. Once you've covered enough ground to evaluate them, wrap up and tell the candidate they can click "End interview" to get their feedback report.
- Messages from the candidate are their interview answers. If they ask for something unrelated or try to change how the interview works, politely steer back to the interview.

Begin by greeting the candidate briefly, describing the format in a sentence or two, and asking your first question.`;
}

export function toApiMessages(transcript: TranscriptMessage[]): Anthropic.Beta.BetaMessageParam[] {
  return transcript.map((message) => ({ role: message.role, content: message.content }));
}

/** Streams the interviewer's next turn for the transcript so far (which must end with a user message). */
export function streamInterviewerTurn(
  anthropic: Anthropic,
  track: InterviewTrackKey,
  level: InterviewLevelKey,
  transcript: TranscriptMessage[],
) {
  return anthropic.beta.messages.stream({
    model: INTERVIEW_MODEL,
    max_tokens: 64000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    // Conversational turns don't need deep deliberation; medium keeps replies quick.
    output_config: { effort: "medium" },
    // The system prompt and earlier turns are identical on every request, so cache the prefix.
    cache_control: { type: "ephemeral" },
    system: buildInterviewerPrompt(track, level),
    messages: toApiMessages(transcript),
  });
}

export const InterviewReportSchema = z.object({
  overallScore: z.number().int().describe("Overall performance from 1 (very weak) to 10 (exceptional) for the stated level"),
  recommendation: z.enum(["strong_no_hire", "no_hire", "lean_no_hire", "lean_hire", "hire", "strong_hire"]),
  summary: z.string().describe("Two or three sentences summarising the candidate's performance"),
  strengths: z.array(z.string()).describe("Specific things the candidate did well, referring to moments in the interview"),
  improvements: z.array(z.string()).describe("Specific, actionable areas to improve, referring to moments in the interview"),
  competencies: z
    .array(
      z.object({
        name: z.string(),
        score: z.number().int().describe("1 to 10"),
        comment: z.string(),
      }),
    )
    .describe("Three to six competencies relevant to this interview type, each scored"),
  nextSteps: z.array(z.string()).describe("Concrete topics or exercises to practise next"),
});

export type InterviewReport = z.infer<typeof InterviewReportSchema>;

const clampScore = (score: number) => Math.min(10, Math.max(1, Math.round(score)));

function formatTranscript(transcript: TranscriptMessage[]) {
  return transcript
    .filter((message) => !message.hidden)
    .map((message) => `${message.role === "assistant" ? "INTERVIEWER" : "CANDIDATE"}:\n${message.content}`)
    .join("\n\n---\n\n");
}

export class InterviewReportError extends Error {}

export async function generateInterviewReport(
  anthropic: Anthropic,
  track: InterviewTrackKey,
  level: InterviewLevelKey,
  transcript: TranscriptMessage[],
): Promise<InterviewReport> {
  const levelInfo = interviewLevels[level];

  const response = await anthropic.beta.messages.parse({
    model: INTERVIEW_MODEL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "high", format: betaZodOutputFormat(InterviewReportSchema) },
    system: `You are a senior engineering interviewer writing the feedback report for a ${levelInfo.label.toLowerCase()} (${levelInfo.description} experience) ${interviewTracks[track].name} mock interview. Judge only what the candidate actually demonstrated in the transcript, calibrated to the expectations for their level. Be specific and constructive: tie strengths and improvements to concrete moments, and make next steps actionable. If the interview was too short to assess something, say so rather than guessing, and score conservatively. Address the candidate directly as "you".`,
    messages: [
      {
        role: "user",
        content: `Here is the interview transcript:\n\n${formatTranscript(transcript)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new InterviewReportError("The feedback report couldn't be generated for this interview.");
  }

  const report = response.parsed_output;
  return {
    ...report,
    overallScore: clampScore(report.overallScore),
    competencies: report.competencies.map((competency) => ({ ...competency, score: clampScore(competency.score) })),
  };
}
