"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";

const features = [
  {
    title: "Real exam timing",
    description: "Every test runs on its own clock and submits itself when time is up, just like the real exam.",
    icon: "M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  },
  {
    title: "Exam-style interface",
    description: "Question palette, mark for review, and clear response — the controls you'll see on exam day.",
    icon: "M4 5h6v6H4V5Zm10 0h6v6h-6V5ZM4 15h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  },
  {
    title: "Detailed solutions",
    description: "Review every question after you submit, with the correct answer and a worked explanation.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    title: "Progress analytics",
    description: "Section-wise accuracy and score history show exactly where to focus your next study session.",
    icon: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  },
];

const steps = [
  { title: "Pick a test", description: "Choose a full-length mock or practise from the question bank." },
  { title: "Attempt it under exam conditions", description: "Timed, with a question palette and mark-for-review." },
  { title: "Review and improve", description: "See solutions, section-wise accuracy, and track your trend." },
];

const plusFeatures = [
  "Unlimited mock test attempts",
  "Full question bank practice",
  "Solutions and explanations for every question",
  "Section-wise performance analysis",
];

const examByCategory = {
  SSC: [
    {
      name: "SSC CGL",
      description: "Tier 1 and Tier 2 objective-focused mock tests for General Studies, Quant, English, and Reasoning.",
      details: ["Tier 1 • 100 Q • 60 min", "Tier 2 Paper 1 • 150 Q • Session-based"],
      notes: [
        "Arithmetic & Number System",
        "Reasoning & Data Interpretation",
        "General Awareness & Current Affairs",
      ],
    },
    {
      name: "SSC CHSL",
      description: "Tier-based practice for General Intelligence, English, Quant, and skill/typing readiness.",
      details: ["Tier 1 • 100 Q • 60 min", "Tier 2 • 135 Q • Session-based"],
      notes: [
        "English Grammar & Vocabulary",
        "Quantitative Aptitude",
        "Skill/Typing & Computer Basics",
      ],
    },
    {
      name: "SSC MTS",
      description: "Session-based mock tests designed for quick revision and paper strategy.",
      details: ["Session 1 • 40 Q • 45 min", "Session 2 • 50 Q • 45 min"],
      notes: [
        "Basic Maths & Speed Calculation",
        "Reasoning Shortcuts",
        "General Awareness Revision",
      ],
    },
    {
      name: "SSC GD Constable",
      description: "Computer-based exam practice for general awareness, reasoning, maths, and aptitude.",
      details: ["Computer Based Exam • 80 Q • 60 min"],
      notes: [
        "GK & Current Affairs",
        "Reasoning & Basic Maths",
        "Computer Knowledge",
      ],
    },
    {
      name: "SSC CPO",
      description: "Multi-paper mock test pattern for objective reasoning and quantitative sections.",
      details: ["Paper 1 • 200 Q • 2 hours", "Paper 2 • 200 Q • 2 hours"],
      notes: [
        "Advanced Reasoning",
        "Quantitative Ability",
        "General Awareness & English",
      ],
    },
    {
      name: "SSC JE",
      description: "Engineering aptitude and technical reasoning mock practice with paper-level difficulty.",
      details: ["Paper 1 • 200 Q • 2 hours"],
      notes: [
        "Technical Concepts",
        "Engineering Aptitude",
        "General Awareness",
      ],
    },
    {
      name: "SSC Stenographer",
      description: "Computer-based practice for aptitude, English, and transcription readiness.",
      details: ["Computer Based Exam • 200 Q • 2 hours"],
      notes: [
        "English & Dictation Practice",
        "Reasoning & Quant",
        "Typing & Accuracy",
      ],
    },
    {
      name: "SSC Selection Post",
      description: "Matriculation, Higher Secondary, and Graduate-level mock test combinations.",
      details: [
        "Matriculation • 100 Q • 60 min",
        "Higher Secondary • 100 Q • 60 min",
        "Graduate • 100 Q • 60 min",
      ],
      notes: [
        "General Awareness",
        "Quant & Reasoning",
        "Post-specific Level Practice",
      ],
    },
  ],
  Banking: [
    {
      name: "IBPS PO",
      description: "Prelims and mains-oriented mock practice for aptitude, reasoning, and English.",
      details: ["Prelims • 100 Q • 60 min", "Mains • 225 Q • 3 hours"],
      notes: [
        "Quant & DI Mastery",
        "Reasoning & Puzzle Practice",
        "English Reading & Error Detection",
      ],
    },
    {
      name: "IBPS Clerk",
      description: "Focused practice for numerical ability, reasoning, and language proficiency.",
      details: ["Prelims • 100 Q • 60 min"],
      notes: [
        "Speed Maths",
        "Simplification Tricks",
        "Grammar & Vocabulary",
      ],
    },
    {
      name: "SBI PO",
      description: "Mock test structure aligned to SBI aptitude, reasoning, and descriptive preparation.",
      details: ["Prelims • 100 Q • 60 min", "Mains • 155 Q • 3 hours"],
      notes: [
        "Data Interpretation",
        "Reasoning Puzzles",
        "Current Affairs & Banking Awareness",
      ],
    },
    {
      name: "SBI Clerk",
      description: "Targeted tests for aptitude, reasoning, and English language scoring practice.",
      details: ["Prelims • 100 Q • 60 min"],
      notes: [
        "Basic Arithmetic",
        "Logic & sequences",
        "English Usage & Comprehension",
      ],
    },
    {
      name: "RBI Grade B",
      description: "Advanced mock format for economic awareness, reasoning, and GA-based scoring.",
      details: ["Phase 1 • 120 Q • 90 min"],
      notes: [
        "Economics & Banking Awareness",
        "Reasoning & Caselets",
        "Current Affairs Deep Revision",
      ],
    },
    {
      name: "IBPS RRB",
      description: "Regional rural bank exam preparation across reasoning, quant, and reasoning aptitude.",
      details: ["Prelims • 80 Q • 60 min"],
      notes: [
        "Speed Maths",
        "Reasoning Ability",
        "Banking Awareness",
      ],
    },
  ],
  Railway: [
    {
      name: "RRB NTPC",
      description: "General awareness and aptitude readiness for non-technical rail recruitment exams.",
      details: ["Stage 1 • 100 Q • 90 min"],
      notes: [
        "General Awareness",
        "Maths & Reasoning",
        "Time Management",
      ],
    },
    {
      name: "RRB Group D",
      description: "Foundation mock tests covering aptitude, reasoning, Japanese, and general awareness.",
      details: ["Computer Based Test • 100 Q • 90 min"],
      notes: [
        "Basic Maths",
        "Reasoning Fundamentals",
        "Railway GK",
      ],
    },
    {
      name: "RRB JE",
      description: "Technical and non-technical paper practice for railway engineering recruitment.",
      details: ["Paper 1 • 100 Q • 90 min"],
      notes: [
        "Engineering Concepts",
        "Technical Aptitude",
        "General Fundamentals",
      ],
    },
    {
      name: "RRB ALP",
      description: "Practice sheets for technical ability, reasoning, and general knowledge modules.",
      details: ["Stage 1 • 75 Q • 60 min"],
      notes: [
        "Technical MCQs",
        "Reasoning Patterns",
        "Railway Awareness",
      ],
    },
    {
      name: "RRB Technician",
      description: "Focused exam strategy for technical and aptitude-based rail recruitment modules.",
      details: ["Computer Based Test • 100 Q • 90 min"],
      notes: [
        "Aptitude Drills",
        "Technical Practice",
        "Accuracy & Speed",
      ],
    },
    {
      name: "Indian Railways",
      description: "General railway recruitment preparation with aptitude and reasoning based test patterns.",
      details: ["Multiple stage patterns"],
      notes: [
        "Static GK",
        "Railway Rules & Awareness",
        "Reasoning Practice",
      ],
    },
  ],
  UPSC: [
    {
      name: "UPSC CSE Prelims",
      description: "GS and CSAT-style prelim practice to improve scoring and time management.",
      details: ["GS • 100 Q • 2 hours", "CSAT • 80 Q • 2 hours"],
      notes: [
        "Polity & Economy",
        "History & Geography",
        "CSAT Problem Solving",
      ],
    },
    {
      name: "UPSC CDS",
      description: "Comprehensive exercise for general knowledge and elementary mathematics sections.",
      details: ["Written exam • 200 Q • 2 hours"],
      notes: [
        "General Knowledge",
        "Elementary Maths",
        "English Language",
      ],
    },
    {
      name: "UPSC CAPF",
      description: "General ability and aptitude mock practice for central armed forces recruitment.",
      details: ["Objective paper • 200 Q • 2 hours"],
      notes: [
        "Current Affairs",
        "General Ability",
        "Reasoning & GK",
      ],
    },
    {
      name: "UPSC IFS",
      description: "Subject-based test readiness for civil services and general aptitude modules.",
      details: ["Prelims • 120 Q • 2 hours"],
      notes: [
        "Economy & Society",
        "Geography & Environment",
        "Analytical Reading",
      ],
    },
    {
      name: "UPSC NDA",
      description: "Mathematics and general ability mock tests for defence aspirants.",
      details: ["Maths • 120 Q • 2.5 hours", "GAT • 150 Q • 2.5 hours"],
      notes: [
        "Maths Speed Tricks",
        "General Ability",
        "Current Affairs & GK",
      ],
    },
  ],
  "State Government": [
    {
      name: "State PSC",
      description: "Mock modules for state-level general studies, aptitude, and local governance questions.",
      details: ["Prelims • 100 Q • 60 min"],
      notes: [
        "State GK & Administration",
        "General Studies",
        "Current Affairs",
      ],
    },
    {
      name: "Police Constable",
      description: "Reasoning, GK, and physical readiness oriented exam simulations.",
      details: ["Objective exam • 80 Q • 60 min"],
      notes: [
        "Reasoning Ability",
        "GK & Current Affairs",
        "Numerical Aptitude",
      ],
    },
    {
      name: "Forest Guard",
      description: "Ideal for general knowledge, reasoning, and subject-wise confidence building.",
      details: ["Objective exam • 100 Q • 90 min"],
      notes: [
        "General Knowledge",
        "Reasoning Practice",
        "Environment & Ecology",
      ],
    },
    {
      name: "Teaching Eligibility",
      description: "Practice sets for child development, pedagogy, and general aptitude modules.",
      details: ["Paper 1 • 150 Q • 2 hours"],
      notes: [
        "Pedagogy",
        "Child Development",
        "General Aptitude",
      ],
    },
    {
      name: "Clerk Recruitment",
      description: "Mock practice across reasoning, typing, and basic aptitude for clerical roles.",
      details: ["Objective exam • 100 Q • 60 min"],
      notes: [
        "Typing Speed",
        "Reasoning Fundamentals",
        "Basic Arithmetic",
      ],
    },
  ],
  "Private Jobs": [
    {
      name: "Software Development",
      description: "Coding and problem-solving mock practice for development roles and technical interviews.",
      details: ["Aptitude • 40 Q • 45 min", "Coding • 2 rounds"],
      notes: [
        "DSA Fundamentals",
        "Problem-Solving Practice",
        "System Design Basics",
      ],
    },
    {
      name: "Java",
      description: "Programming problem sets for Java-specific concepts and coding aptitude.",
      details: ["Java basics • 25 Q • 30 min"],
      notes: [
        "OOP Concepts",
        "Collections & Streams",
        "Core Java Practice",
      ],
    },
    {
      name: "Python",
      description: "Python challenge readiness with logic, OOP, and data structure exercises.",
      details: ["Python fundamentals • 30 Q • 40 min"],
      notes: [
        "Data Structures",
        "OOP & Pythonic Syntax",
        "Logical Reasoning",
      ],
    },
    {
      name: "SQL",
      description: "Database question practice for joins, queries, indexing, and problem-solving.",
      details: ["SQL test • 25 Q • 30 min"],
      notes: [
        "Joins & Subqueries",
        "Indexes & Constraints",
        "DDL/DML Practice",
      ],
    },
    {
      name: "Data Science",
      description: "Statistics, machine learning, and analytics assessment modules for data-driven roles.",
      details: ["Analytics • 20 Q • 30 min"],
      notes: [
        "Statistics",
        "Probability",
        "Data Visualization",
      ],
    },
    {
      name: "Aptitude",
      description: "Speed and accuracy practice for arithmetic, logical reasoning, and analytical thinking.",
      details: ["Aptitude • 30 Q • 45 min"],
      notes: [
        "Arithmetic Skills",
        "Logical Reasoning",
        "Speed Accuracy",
      ],
    },
  ],
} as const;

const categoryOrder = Object.keys(examByCategory) as Array<keyof typeof examByCategory>;

const sampleOptions = ["40 km/h", "50 km/h", "60 km/h", "70 km/h"];

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d={path} />
    </svg>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<keyof typeof examByCategory>("SSC");

  return (
    <main className="min-h-screen text-slate-900">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              SSC, Banking, Railway, UPSC &amp; more
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Practise like it&apos;s <span className="text-indigo-600">exam day.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Timed mock tests with a real exam interface, instant scoring, and detailed solutions — so you know
              exactly what to work on next.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tests"
                className="rounded-full bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-500"
              >
                Browse mock tests
              </Link>
              <Link
                href="/questions"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-center text-base font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900"
              >
                Practise questions
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">Full access for ₹49/month. Cancel anytime.</p>
          </div>

          {/* Product preview: a static sample question, not live data. */}
          <div className="relative" aria-label="Preview of the test interface">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-200/60 via-white to-violet-200/50 blur-2xl" />
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-300/40">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sample question</p>
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-700">
                  42:18
                </span>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-amber-700">Quantitative Aptitude</p>
              <p className="mt-2 font-semibold text-slate-900">
                A train travels 180 km in 3 hours. What is its average speed?
              </p>
              <div className="mt-4 space-y-2">
                {sampleOptions.map((option, index) => (
                  <div
                    key={option}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                      index === 2
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="font-semibold text-slate-400">{String.fromCharCode(65 + index)}</span>
                    {option}
                    {index === 2 && <span className="ml-auto text-xs font-semibold">Correct</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-indigo-50 p-3 text-xs leading-5 text-indigo-800">
                <span className="font-semibold">Solution: </span>Average speed = distance ÷ time = 180 ÷ 3 = 60 km/h.
              </div>
              <div className="mt-4 grid grid-cols-8 gap-1.5">
                {Array.from({ length: 16 }, (_, index) => (
                  <span
                    key={index}
                    className={`h-6 rounded-md ${
                      index === 5
                        ? "bg-indigo-600"
                        : [0, 1, 2, 4, 7, 9].includes(index)
                          ? "bg-emerald-200"
                          : index === 3 || index === 10
                            ? "bg-violet-200"
                            : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {features.map((feature) => (
            <div key={feature.title}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon path={feature.icon} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exam categories */}
      <section id="categories" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Exams</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Government &amp; private job exams</h2>
            <p className="mt-2 max-w-2xl text-slate-600">Exam patterns and key topics for the papers you&apos;re preparing for.</p>
          </div>
          <Link href="/tests" className="shrink-0 text-sm font-semibold text-indigo-700 hover:text-indigo-500">
            See available mock tests →
          </Link>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Exam categories">
          {categoryOrder.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                activeCategory === category
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="tabpanel">
          {examByCategory[activeCategory].map((exam) => (
            <article
              key={exam.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-slate-900">{exam.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{exam.description}</p>

              <ul className="mt-4 space-y-1.5">
                {exam.details.map((detail) => (
                  <li key={detail} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    {detail}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
                {exam.notes.map((note) => (
                  <span key={note} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {note}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 px-6 py-12 text-white sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Three steps to a better score</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Pricing</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">One simple plan</h2>
            <p className="mt-3 text-slate-600">Everything you need to prepare, for less than the cost of a single book.</p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight text-slate-900">₹49</span>
              <span className="text-slate-500">/month</span>
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Get started
            </Link>
          </div>
          <ul className="space-y-3">
            {plusFeatures.map((item) => (
              <li key={item} className="flex items-start gap-3 text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Mock Test Platform</p>
          <p>Coming soon: leaderboards and personalised study plans.</p>
        </div>
      </footer>
    </main>
  );
}
