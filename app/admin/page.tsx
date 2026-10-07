"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  bookingStatusLabels,
  formatIst,
  interviewTracks,
  PANEL_PRICE_INR,
  type BookingStatusKey,
  type InterviewTrackKey,
} from "@/lib/interviews";
import { examPresetOptions } from "@/lib/exam-data";

type QuestionRow = {
  id: string;
  category: string;
  difficulty: string;
  questionText: string;
  options: string[];
  correctOption: number;
  explanation?: string;
  createdBy?: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  subscription?: {
    plan?: string;
    status?: string;
  } | null;
};

type TestRow = {
  id: string;
  title: string;
  examName: string;
  description?: string;
  durationMinutes: number;
  isPublished: boolean;
  questionCount: number;
  createdBy?: string;
};

type BookingRow = {
  id: string;
  track: InterviewTrackKey;
  scheduledAt: string;
  priceInr: number;
  status: BookingStatusKey;
  notes: string | null;
  interviewerName: string | null;
  meetingLink: string | null;
  candidate: { name: string; email: string };
};

type Notice = { tone: "success" | "error"; text: string } | null;

type AdminData = {
  isAdmin: boolean;
  questions?: QuestionRow[];
  users?: UserRow[];
  tests?: TestRow[];
  bookings?: BookingRow[];
};

async function fetchAdminData(): Promise<AdminData> {
  try {
    const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
    const meData = meResponse.ok ? ((await meResponse.json()) as { user?: { isAdmin?: boolean } }) : null;

    if (!meData?.user?.isAdmin) {
      return { isAdmin: false };
    }

    const [questionsResponse, usersResponse, testsResponse, bookingsResponse] = await Promise.all([
      fetch("/api/admin/questions", { cache: "no-store" }),
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch("/api/admin/tests", { cache: "no-store" }),
      fetch("/api/admin/interviews", { cache: "no-store" }),
    ]);

    return {
      isAdmin: true,
      questions: questionsResponse.ok ? ((await questionsResponse.json()) as QuestionRow[]) : undefined,
      users: usersResponse.ok ? ((await usersResponse.json()) as UserRow[]) : undefined,
      tests: testsResponse.ok ? ((await testsResponse.json()) as TestRow[]) : undefined,
      bookings: bookingsResponse.ok ? ((await bookingsResponse.json()) as BookingRow[]) : undefined,
    };
  } catch {
    return { isAdmin: false };
  }
}

const defaultQuestionForm = {
  category: "",
  difficulty: "MEDIUM",
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: 0,
  explanation: "",
};

const defaultTestForm = {
  title: "",
  examName: "",
  description: "",
  durationMinutes: 60,
  isPublished: true,
};

const defaultCsvImportForm = {
  category: "",
  difficulty: "MEDIUM",
  title: "",
  examName: "",
  durationMinutes: 60,
  isPublished: true,
};

const tabs = [
  { key: "overview", label: "Overview", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { key: "questions", label: "Questions", icon: "M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V14m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  { key: "tests", label: "Mock tests", icon: "M9 5h10M9 12h10M9 19h10M5 5h.01M5 12h.01M5 19h.01" },
  { key: "interviews", label: "Interviews", icon: "M15 10l4.6-2.3A1 1 0 0 1 21 8.6v6.8a1 1 0 0 1-1.4.9L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" },
  { key: "users", label: "Users", icon: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1m20 0v-1a4 4 0 0 0-3-3.9M15 3.1a4 4 0 0 1 0 7.8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-surface px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
const labelClass = "block space-y-1.5 text-sm font-medium text-slate-700";
const cardClass = "rounded-2xl border border-slate-200 bg-surface shadow-sm";

const difficultyTone: Record<string, string> = {
  EASY: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HARD: "bg-rose-50 text-rose-700",
};

function Icon({ path, className = "h-5 w-5" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={path} />
    </svg>
  );
}

function NoticeBanner({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  if (!notice) {
    return null;
  }

  return (
    <div
      role={notice.tone === "error" ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        notice.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      <span>{notice.text}</span>
      <button type="button" onClick={onDismiss} className="shrink-0 font-semibold opacity-70 hover:opacity-100" aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Pill({ children, className }: { children: ReactNode; className: string }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}

const bookingStatusTone: Record<BookingStatusKey, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-500",
};

type BookingUpdate = Pick<BookingRow, "id" | "status" | "interviewerName" | "meetingLink">;

function AdminBookingRow({
  booking,
  onSaved,
  onError,
}: {
  booking: BookingRow;
  onSaved: (updated: BookingUpdate, message: string) => void;
  onError: (message: string) => void;
}) {
  const [status, setStatus] = useState<BookingStatusKey>(booking.status);
  const [interviewerName, setInterviewerName] = useState(booking.interviewerName ?? "");
  const [meetingLink, setMeetingLink] = useState(booking.meetingLink ?? "");
  const [saving, setSaving] = useState(false);

  const dirty =
    status !== booking.status ||
    interviewerName !== (booking.interviewerName ?? "") ||
    meetingLink !== (booking.meetingLink ?? "");

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/interviews/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, interviewerName, meetingLink }),
      });
      const data = (await response.json()) as BookingUpdate & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Couldn't update the booking.");
      }
      onSaved(data, `Booking for ${booking.candidate.name} updated.`);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Couldn't update the booking.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className={`${cardClass} p-5`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">
              {formatIst(booking.scheduledAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
            </p>
            <Pill className="bg-indigo-50 text-indigo-700">{interviewTracks[booking.track].label}</Pill>
            <Pill className={bookingStatusTone[booking.status]}>{bookingStatusLabels[booking.status]}</Pill>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {booking.candidate.name} ·{" "}
            <a href={`mailto:${booking.candidate.email}`} className="text-indigo-700 hover:text-indigo-500">
              {booking.candidate.email}
            </a>{" "}
            · ₹{booking.priceInr}
          </p>
          {booking.notes && <p className="mt-2 max-w-xl whitespace-pre-wrap text-sm text-slate-600">“{booking.notes}”</p>}
        </div>

        <div className="grid shrink-0 gap-2 sm:grid-cols-2 sm:items-end xl:grid-cols-[150px_150px_210px_auto]">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as BookingStatusKey)} className={`${inputClass} py-2`}>
              {Object.entries(bookingStatusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Interviewer
            <input value={interviewerName} onChange={(event) => setInterviewerName(event.target.value)} placeholder="Name" className={`${inputClass} py-2`} />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Meeting link
            <input
              value={meetingLink}
              onChange={(event) => setMeetingLink(event.target.value)}
              placeholder="https://meet.google.com/..."
              className={`${inputClass} py-2`}
            />
          </label>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!dirty || saving}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </li>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tests, setTests] = useState<TestRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  // "Upcoming" is relative to when the page loaded; reading the clock during render isn't allowed.
  const [loadedAt] = useState(() => Date.now());
  const [bookingFilter, setBookingFilter] = useState<"upcoming" | "pending" | "all">("upcoming");
  const [loading, setLoading] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionForm, setQuestionForm] = useState(defaultQuestionForm);
  const [testForm, setTestForm] = useState(defaultTestForm);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImportForm, setCsvImportForm] = useState(defaultCsvImportForm);
  const [csvImporting, setCsvImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [questionPanel, setQuestionPanel] = useState<"none" | "add" | "import">("none");
  const [showTestBuilder, setShowTestBuilder] = useState(false);
  const [togglingTestId, setTogglingTestId] = useState<string | null>(null);
  const [questionSearch, setQuestionSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [pickerSearch, setPickerSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userAccessFilter, setUserAccessFilter] = useState<"all" | "admin" | "user">("all");

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalQuestions: questions.length,
      totalTests: tests.length,
      activePaidUsers: users.filter(
        (user) => user.subscription?.plan && user.subscription.plan !== "FREE" && user.subscription.status === "ACTIVE",
      ).length,
      publishedTests: tests.filter((test) => test.isPublished).length,
      adminUsers: users.filter((user) => user.isAdmin).length,
    }),
    [questions, tests, users],
  );

  const categories = useMemo(() => [...new Set(questions.map((question) => question.category))].sort(), [questions]);

  const applyAdminData = (data: AdminData) => {
    setIsAdmin(data.isAdmin);
    if (data.questions) setQuestions(data.questions);
    if (data.users) setUsers(data.users);
    if (data.tests) setTests(data.tests);
    if (data.bookings) setBookings(data.bookings);
    setLoading(false);
  };

  const loadAdminData = async () => applyAdminData(await fetchAdminData());

  useEffect(() => {
    void fetchAdminData().then(applyAdminData);
  }, []);

  const filteredQuestions = useMemo(() => {
    const searchValue = questionSearch.trim().toLowerCase();
    return questions.filter(
      (question) =>
        (!searchValue || question.questionText.toLowerCase().includes(searchValue)) &&
        (categoryFilter === "all" || question.category === categoryFilter) &&
        (difficultyFilter === "all" || question.difficulty === difficultyFilter),
    );
  }, [categoryFilter, difficultyFilter, questionSearch, questions]);

  const pickerQuestions = useMemo(() => {
    const searchValue = pickerSearch.trim().toLowerCase();
    return questions.filter(
      (question) =>
        !searchValue ||
        question.questionText.toLowerCase().includes(searchValue) ||
        question.category.toLowerCase().includes(searchValue),
    );
  }, [pickerSearch, questions]);

  const filteredUsers = useMemo(() => {
    const searchValue = userSearch.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !searchValue ||
        user.name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue);

      const matchesAccess =
        userAccessFilter === "all" ||
        (userAccessFilter === "admin" && user.isAdmin) ||
        (userAccessFilter === "user" && !user.isAdmin);

      return matchesSearch && matchesAccess;
    });
  }, [userAccessFilter, userSearch, users]);

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setNotice(null);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleQuestionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingQuestion(true);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: questionForm.category,
          difficulty: questionForm.difficulty,
          questionText: questionForm.questionText,
          options: [questionForm.optionA, questionForm.optionB, questionForm.optionC, questionForm.optionD],
          correctOption: questionForm.correctOption,
          explanation: questionForm.explanation,
          isActive: true,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save the question");
      }

      setNotice({ tone: "success", text: "Question added to the bank." });
      // Keep the category so several questions in a row are quicker to enter.
      setQuestionForm({ ...defaultQuestionForm, category: questionForm.category, difficulty: questionForm.difficulty });
      await loadAdminData();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Unable to save the question." });
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleTestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (selectedQuestionIds.length === 0) {
      setNotice({ tone: "error", text: "Select at least one question to build the mock test." });
      return;
    }

    setSubmittingTest(true);

    try {
      const response = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: testForm.title,
          examName: testForm.examName,
          description: testForm.description,
          durationMinutes: testForm.durationMinutes,
          isPublished: testForm.isPublished,
          questionIds: selectedQuestionIds,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create mock test");
      }

      setNotice({
        tone: "success",
        text: `“${testForm.title}” created with ${selectedQuestionIds.length} questions${testForm.isPublished ? " and published" : " as a draft"}.`,
      });
      setSelectedQuestionIds([]);
      setTestForm(defaultTestForm);
      setShowTestBuilder(false);
      await loadAdminData();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Unable to create mock test." });
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleCsvImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!csvFile) {
      setNotice({ tone: "error", text: "Choose a CSV file to import." });
      return;
    }

    setCsvImporting(true);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("category", csvImportForm.category || "General");
      formData.append("difficulty", csvImportForm.difficulty);
      formData.append("title", csvImportForm.title);
      formData.append("examName", csvImportForm.examName);
      formData.append("durationMinutes", String(csvImportForm.durationMinutes));
      formData.append("isPublished", String(csvImportForm.isPublished));

      const response = await fetch("/api/admin/questions/import", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        created?: number;
        skippedRows?: number[];
        test?: { id?: string; title?: string; questionCount?: number } | null;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to import the CSV file.");
      }

      const skipped = data.skippedRows?.length
        ? ` Skipped rows ${data.skippedRows.join(", ")} because the correct option couldn't be read.`
        : "";
      setNotice({
        tone: data.skippedRows?.length ? "error" : "success",
        text:
          (data.test
            ? `Imported ${data.created ?? 0} questions and created “${data.test.title}”.`
            : `Imported ${data.created ?? 0} questions.`) + skipped,
      });
      setCsvFile(null);
      setCsvImportForm(defaultCsvImportForm);
      setQuestionPanel("none");
      await loadAdminData();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Unable to import CSV questions." });
    } finally {
      setCsvImporting(false);
    }
  };

  const handleTogglePublish = async (test: TestRow) => {
    setTogglingTestId(test.id);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/tests/${test.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !test.isPublished }),
      });

      const data = (await response.json()) as { error?: string; isPublished?: boolean };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update the test.");
      }

      setTests((current) =>
        current.map((item) => (item.id === test.id ? { ...item, isPublished: Boolean(data.isPublished) } : item)),
      );
      setNotice({
        tone: "success",
        text: `“${test.title}” is now ${data.isPublished ? "published and visible to students" : "a draft, hidden from students"}.`,
      });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Unable to update the test." });
    } finally {
      setTogglingTestId(null);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds((current) =>
      current.includes(questionId) ? current.filter((item) => item !== questionId) : [...current, questionId],
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-slate-500" aria-busy="true">
        Loading admin dashboard...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-surface p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Admin access required</p>
          <p className="mt-2 text-sm text-slate-600">Log in with an admin account to manage questions, tests, and users.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Log in as admin
            </Link>
            <Link href="/" className="rounded-full border border-slate-300 bg-surface px-5 py-2 text-sm font-semibold text-slate-700">
              Go home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const tabCounts: Partial<Record<TabKey, number>> = {
    questions: stats.totalQuestions,
    tests: stats.totalTests,
    users: stats.totalUsers,
    interviews: bookings.filter((booking) => booking.status === "PENDING_PAYMENT").length,
  };

  const renderOverview = () => {
    const statCards = [
      { label: "Users", value: stats.totalUsers, hint: `${stats.activePaidUsers} on a paid plan`, tab: "users" as TabKey },
      { label: "Questions", value: stats.totalQuestions, hint: `${categories.length} categories`, tab: "questions" as TabKey },
      { label: "Mock tests", value: stats.totalTests, hint: `${stats.publishedTests} published`, tab: "tests" as TabKey },
      { label: "Admins", value: stats.adminUsers, hint: "With full access", tab: "users" as TabKey },
    ];

    const quickActions = [
      {
        title: "Add a question",
        description: "Write a single question with options and an explanation.",
        onClick: () => {
          switchTab("questions");
          setQuestionPanel("add");
        },
      },
      {
        title: "Import from CSV",
        description: "Bulk-upload questions and optionally create a test from them.",
        onClick: () => {
          switchTab("questions");
          setQuestionPanel("import");
        },
      },
      {
        title: "Build a mock test",
        description: "Pick questions from the bank and set the timing.",
        onClick: () => {
          switchTab("tests");
          setShowTestBuilder(true);
        },
      },
    ];

    return (
      <div className="space-y-6">
        <SectionHeader title="Overview" description="A snapshot of your platform's content and users." />

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {statCards.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => switchTab(card.tab)}
              className={`${cardClass} p-5 text-left hover:border-indigo-200 hover:shadow-md`}
            >
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.title}
              type="button"
              onClick={action.onClick}
              className="group flex items-start justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 text-left hover:border-indigo-300 hover:bg-indigo-50"
            >
              <span>
                <span className="block font-semibold text-slate-900">{action.title}</span>
                <span className="mt-1 block text-sm text-slate-600">{action.description}</span>
              </span>
              <span className="text-indigo-500 transition group-hover:translate-x-0.5" aria-hidden>
                →
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={`${cardClass} min-w-0 p-5`}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent mock tests</h2>
              <button type="button" onClick={() => switchTab("tests")} className="text-sm font-semibold text-indigo-700 hover:text-indigo-500">
                View all
              </button>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {tests.slice(0, 5).map((test) => (
                <li key={test.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{test.title}</span>
                    <span className="block text-xs text-slate-500">
                      {test.examName} · {test.questionCount} questions · {test.durationMinutes} min
                    </span>
                  </span>
                  <Pill className={test.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                    {test.isPublished ? "Published" : "Draft"}
                  </Pill>
                </li>
              ))}
              {tests.length === 0 && <li className="py-3 text-sm text-slate-500">No mock tests yet.</li>}
            </ul>
          </section>

          <section className={`${cardClass} min-w-0 p-5`}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Latest questions</h2>
              <button type="button" onClick={() => switchTab("questions")} className="text-sm font-semibold text-indigo-700 hover:text-indigo-500">
                View all
              </button>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {questions.slice(0, 5).map((question) => (
                <li key={question.id} className="py-3">
                  <p className="truncate text-sm font-medium text-slate-900">{question.questionText}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {question.category} · {question.difficulty.charAt(0) + question.difficulty.slice(1).toLowerCase()}
                  </p>
                </li>
              ))}
              {questions.length === 0 && <li className="py-3 text-sm text-slate-500">No questions yet.</li>}
            </ul>
          </section>
        </div>
      </div>
    );
  };

  const renderQuestionForm = () => (
    <form onSubmit={handleQuestionSubmit} className={`${cardClass} space-y-5 p-6`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">New question</h2>
        <button type="button" onClick={() => setQuestionPanel("none")} className="text-sm text-slate-500 hover:text-slate-900">
          Cancel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Category
          <input
            required
            minLength={2}
            list="question-categories"
            value={questionForm.category}
            onChange={(event) => setQuestionForm({ ...questionForm, category: event.target.value })}
            placeholder="e.g. Quantitative Aptitude"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Difficulty
          <select
            value={questionForm.difficulty}
            onChange={(event) => setQuestionForm({ ...questionForm, difficulty: event.target.value })}
            className={inputClass}
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </label>
      </div>

      <label className={labelClass}>
        Question
        <textarea
          required
          minLength={10}
          value={questionForm.questionText}
          onChange={(event) => setQuestionForm({ ...questionForm, questionText: event.target.value })}
          placeholder="Type the question"
          className={inputClass}
          rows={3}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Options — select the correct answer</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(["optionA", "optionB", "optionC", "optionD"] as const).map((key, index) => {
            const isCorrect = questionForm.correctOption === index;
            return (
              <div
                key={key}
                className={`flex items-center gap-2 rounded-xl border p-1.5 pl-3 ${
                  isCorrect ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-surface"
                }`}
              >
                <input
                  type="radio"
                  name="correctOption"
                  checked={isCorrect}
                  onChange={() => setQuestionForm({ ...questionForm, correctOption: index })}
                  aria-label={`Option ${String.fromCharCode(65 + index)} is correct`}
                  className="accent-emerald-600"
                />
                <span className="text-sm font-semibold text-slate-500">{String.fromCharCode(65 + index)}</span>
                <input
                  required
                  value={questionForm[key]}
                  onChange={(event) => setQuestionForm({ ...questionForm, [key]: event.target.value })}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      <label className={labelClass}>
        Explanation <span className="font-normal text-slate-400">(shown after the test)</span>
        <textarea
          value={questionForm.explanation}
          onChange={(event) => setQuestionForm({ ...questionForm, explanation: event.target.value })}
          placeholder="Why is this the correct answer?"
          className={inputClass}
          rows={2}
        />
      </label>

      <button
        type="submit"
        disabled={submittingQuestion}
        className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {submittingQuestion ? "Saving..." : "Add question"}
      </button>
    </form>
  );

  const renderCsvImport = () => (
    <form onSubmit={handleCsvImport} className={`${cardClass} space-y-5 p-6`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Import questions from CSV</h2>
        <button type="button" onClick={() => setQuestionPanel("none")} className="text-sm text-slate-500 hover:text-slate-900">
          Cancel
        </button>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-indigo-300 hover:bg-indigo-50/40">
        <span className="text-sm font-semibold text-slate-800">{csvFile ? csvFile.name : "Choose a CSV file"}</span>
        <span className="text-xs text-slate-500">
          {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB · click to change` : "Click to browse"}
        </span>
        <input type="file" accept=".csv" onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)} className="sr-only" />
      </label>

      <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
        <p>
          <span className="font-semibold text-slate-800">Required columns:</span> questionText, optionA, optionB, optionC,
          optionD, correctOption
        </p>
        <p>
          <span className="font-semibold text-slate-800">Optional:</span> category, difficulty, explanation
        </p>
        <p className="mt-1">correctOption can be a letter (A–D), a number (1–4), or the exact answer text.</p>
        <a
          href="/questions-template.csv"
          download
          className="mt-2 inline-block font-semibold text-indigo-700 hover:text-indigo-500"
        >
          Download a template CSV
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Default category
          <input
            list="question-categories"
            value={csvImportForm.category}
            onChange={(event) => setCsvImportForm({ ...csvImportForm, category: event.target.value })}
            placeholder="Used when a row has none"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Default difficulty
          <select
            value={csvImportForm.difficulty}
            onChange={(event) => setCsvImportForm({ ...csvImportForm, difficulty: event.target.value })}
            className={inputClass}
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-700">
          Also create a mock test <span className="font-normal text-slate-400">(leave the title empty to skip)</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Test title
            <input
              value={csvImportForm.title}
              onChange={(event) => setCsvImportForm({ ...csvImportForm, title: event.target.value })}
              placeholder="e.g. SSC CGL Mock 1"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Exam name
            <input
              list="exam-presets"
              value={csvImportForm.examName}
              onChange={(event) => setCsvImportForm({ ...csvImportForm, examName: event.target.value })}
              placeholder="e.g. SSC CGL - Tier 1"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Duration (minutes)
            <input
              type="number"
              min={1}
              max={300}
              value={csvImportForm.durationMinutes}
              onChange={(event) => setCsvImportForm({ ...csvImportForm, durationMinutes: Number(event.target.value) })}
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={csvImportForm.isPublished}
              onChange={(event) => setCsvImportForm({ ...csvImportForm, isPublished: event.target.checked })}
              className="accent-indigo-600"
            />
            Publish immediately
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={csvImporting || !csvFile}
        className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {csvImporting ? "Importing..." : "Import questions"}
      </button>
    </form>
  );

  const renderQuestions = () => (
    <div className="space-y-6">
      <SectionHeader
        title="Question bank"
        description={`${stats.totalQuestions} questions across ${categories.length} categories.`}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setQuestionPanel(questionPanel === "import" ? "none" : "import")}
              className="rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              Import CSV
            </button>
            <button
              type="button"
              onClick={() => setQuestionPanel(questionPanel === "add" ? "none" : "add")}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Add question
            </button>
          </div>
        }
      />

      {questionPanel === "add" && renderQuestionForm()}
      {questionPanel === "import" && renderCsvImport()}

      <section className={cardClass}>
        <div className="flex flex-col gap-2 border-b border-slate-200 p-4 sm:flex-row">
          <input
            type="search"
            value={questionSearch}
            onChange={(event) => setQuestionSearch(event.target.value)}
            placeholder="Search questions"
            aria-label="Search questions"
            className={`${inputClass} sm:max-w-xs`}
          />
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category" className={`${inputClass} sm:w-56`}>
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)} aria-label="Filter by difficulty" className={`${inputClass} sm:w-40`}>
            <option value="all">All difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          <span className="self-center whitespace-nowrap text-xs text-slate-500 sm:ml-auto">
            {filteredQuestions.length} of {questions.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Question</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Difficulty</th>
                <th className="px-4 py-3 font-semibold">Answer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    {questions.length === 0 ? "No questions yet. Add one or import a CSV." : "No questions match these filters."}
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((question) => (
                  <tr key={question.id} className="align-top hover:bg-slate-50">
                    <td className="max-w-md px-4 py-3">
                      <p className="line-clamp-2 font-medium text-slate-900">{question.questionText}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{question.category}</td>
                    <td className="px-4 py-3">
                      <Pill className={difficultyTone[question.difficulty] ?? "bg-slate-100 text-slate-600"}>
                        {question.difficulty.charAt(0) + question.difficulty.slice(1).toLowerCase()}
                      </Pill>
                    </td>
                    <td className="max-w-48 px-4 py-3 text-slate-600">
                      <span className="mr-1.5 font-semibold text-emerald-700">{String.fromCharCode(65 + question.correctOption)}</span>
                      <span className="line-clamp-1">{question.options[question.correctOption]}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderTestBuilder = () => (
    <form onSubmit={handleTestSubmit} className={`${cardClass} p-6`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">New mock test</h2>
        <button type="button" onClick={() => setShowTestBuilder(false)} className="text-sm text-slate-500 hover:text-slate-900">
          Cancel
        </button>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <label className={labelClass}>
            Test title
            <input
              required
              minLength={3}
              value={testForm.title}
              onChange={(event) => setTestForm({ ...testForm, title: event.target.value })}
              placeholder="e.g. SSC CGL Tier 1 — Full Mock 3"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Exam name
            <input
              required
              minLength={2}
              list="exam-presets"
              value={testForm.examName}
              onChange={(event) => setTestForm({ ...testForm, examName: event.target.value })}
              placeholder="e.g. SSC CGL - Tier 1"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Description <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              value={testForm.description}
              onChange={(event) => setTestForm({ ...testForm, description: event.target.value })}
              placeholder="What this test covers"
              className={inputClass}
              rows={3}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={labelClass}>
              Duration (minutes)
              <input
                type="number"
                min={1}
                max={300}
                value={testForm.durationMinutes}
                onChange={(event) => setTestForm({ ...testForm, durationMinutes: Number(event.target.value) })}
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={testForm.isPublished}
                onChange={(event) => setTestForm({ ...testForm, isPublished: event.target.checked })}
                className="accent-indigo-600"
              />
              Publish now
            </label>
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
            <input
              type="search"
              value={pickerSearch}
              onChange={(event) => setPickerSearch(event.target.value)}
              placeholder="Search by text or category"
              aria-label="Search questions to add"
              className={`${inputClass} min-w-0 flex-1 py-2`}
            />
            <button
              type="button"
              onClick={() =>
                setSelectedQuestionIds((current) => [
                  ...current,
                  ...pickerQuestions.map((question) => question.id).filter((id) => !current.includes(id)),
                ])
              }
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-500"
            >
              Select shown
            </button>
            <button
              type="button"
              onClick={() => setSelectedQuestionIds([])}
              disabled={selectedQuestionIds.length === 0}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {pickerQuestions.length === 0 ? (
              <li className="p-4 text-sm text-slate-500">No questions found.</li>
            ) : (
              pickerQuestions.map((question) => {
                const order = selectedQuestionIds.indexOf(question.id);
                return (
                  <li key={question.id}>
                    <label className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 ${order >= 0 ? "bg-indigo-50/60" : "hover:bg-slate-50"}`}>
                      <input
                        type="checkbox"
                        checked={order >= 0}
                        onChange={() => toggleQuestionSelection(question.id)}
                        className="mt-1 accent-indigo-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm text-slate-900">{question.questionText}</span>
                        <span className="text-xs text-slate-500">
                          {question.category} · {question.difficulty.charAt(0) + question.difficulty.slice(1).toLowerCase()}
                        </span>
                      </span>
                      {order >= 0 && (
                        <span className="rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white" title="Position in the test">
                          {order + 1}
                        </span>
                      )}
                    </label>
                  </li>
                );
              })
            )}
          </ul>
          <p className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
            {selectedQuestionIds.length} selected · questions appear in the order you pick them
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={submittingTest}
        className="mt-6 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {submittingTest ? "Creating..." : `Create test${selectedQuestionIds.length ? ` with ${selectedQuestionIds.length} questions` : ""}`}
      </button>
    </form>
  );

  const renderTests = () => (
    <div className="space-y-6">
      <SectionHeader
        title="Mock tests"
        description={`${stats.publishedTests} of ${stats.totalTests} published. Drafts are hidden from students.`}
        action={
          !showTestBuilder && (
            <button
              type="button"
              onClick={() => setShowTestBuilder(true)}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              New mock test
            </button>
          )
        }
      />

      {showTestBuilder && renderTestBuilder()}

      <section className={`${cardClass} overflow-x-auto`}>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Test</th>
              <th className="px-4 py-3 font-semibold">Questions</th>
              <th className="px-4 py-3 font-semibold">Duration</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No mock tests yet. Create one from the question bank.
                </td>
              </tr>
            ) : (
              tests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{test.title}</p>
                    <p className="text-xs text-slate-500">{test.examName}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{test.questionCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{test.durationMinutes} min</td>
                  <td className="px-4 py-3">
                    <Pill className={test.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                      {test.isPublished ? "Published" : "Draft"}
                    </Pill>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link href={`/tests/${test.id}`} className="mr-2 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                      Preview
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleTogglePublish(test)}
                      disabled={togglingTestId === test.id}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                        test.isPublished
                          ? "border-slate-300 bg-surface text-slate-700 hover:border-slate-400"
                          : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500"
                      }`}
                    >
                      {togglingTestId === test.id ? "Saving..." : test.isPublished ? "Unpublish" : "Publish"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );

  const renderInterviews = () => {
    const visible = bookings
      .filter((booking) =>
        bookingFilter === "pending"
          ? booking.status === "PENDING_PAYMENT"
          : bookingFilter === "upcoming"
            ? new Date(booking.scheduledAt).getTime() >= loadedAt - 60 * 60 * 1000 && booking.status !== "CANCELLED"
            : true,
      )
      .sort((a, b) =>
        bookingFilter === "all"
          ? new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
          : new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
    const pending = bookings.filter((booking) => booking.status === "PENDING_PAYMENT").length;

    return (
      <div className="space-y-6">
        <SectionHeader
          title="Panel interviews"
          description={`₹${PANEL_PRICE_INR}/hour bookings · ${pending} awaiting payment confirmation · times in IST`}
        />

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter bookings">
          {(
            [
              ["upcoming", "Upcoming"],
              ["pending", `Pending payment (${pending})`],
              ["all", "All"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={bookingFilter === key}
              onClick={() => setBookingFilter(key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                bookingFilter === key ? "bg-ink text-white" : "border border-slate-200 bg-surface text-slate-600 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className={`${cardClass} p-10 text-center text-sm text-slate-500`}>No bookings here.</div>
        ) : (
          <ul className="space-y-3">
            {visible.map((booking) => (
              <AdminBookingRow
                key={booking.id}
                booking={booking}
                onSaved={(updated, message) => {
                  setBookings((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
                  setNotice({ tone: "success", text: message });
                }}
                onError={(message) => setNotice({ tone: "error", text: message })}
              />
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-6">
      <SectionHeader
        title="Users"
        description={`${stats.totalUsers} registered · ${stats.activePaidUsers} paid · ${stats.adminUsers} admin${stats.adminUsers === 1 ? "" : "s"}`}
      />

      <section className={cardClass}>
        <div className="flex flex-col gap-2 border-b border-slate-200 p-4 sm:flex-row">
          <input
            type="search"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder="Search by name or email"
            aria-label="Search users"
            className={`${inputClass} sm:max-w-xs`}
          />
          <select
            value={userAccessFilter}
            onChange={(event) => setUserAccessFilter(event.target.value as "all" | "admin" | "user")}
            aria-label="Filter by role"
            className={`${inputClass} sm:w-40`}
          >
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="user">Students</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    {users.length === 0 ? "No users yet." : "No users match your search."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const plan = user.subscription?.plan ?? "FREE";
                  const status = user.subscription?.status ?? "ACTIVE";
                  return (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-900">{user.name}</span>
                            <span className="block truncate text-xs text-slate-500">{user.email}</span>
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{plan.charAt(0) + plan.slice(1).toLowerCase()}</td>
                      <td className="px-4 py-3">
                        <Pill className={status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </Pill>
                      </td>
                      <td className="px-4 py-3">
                        <Pill className={user.isAdmin ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}>
                          {user.isAdmin ? "Admin" : "Student"}
                        </Pill>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar (desktop) / top bar (mobile) */}
      <aside className="sticky top-0 z-20 border-b border-slate-200 bg-surface lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-5 lg:py-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">M</span>
              <span>
                <span className="block text-sm font-semibold leading-tight text-slate-900">Mock Test Platform</span>
                <span className="block text-xs text-slate-500">Admin</span>
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle className="lg:hidden" />
              <Link href="/" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 lg:hidden">
                Site
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 lg:hidden"
              >
                Log out
              </button>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Admin sections">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => switchTab(tab.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon path={tab.icon} className="hidden h-[18px] w-[18px] lg:block" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tabCounts[tab.key] !== undefined && (
                    <span className={`ml-auto rounded-full px-2 text-xs ${isActive ? "bg-indigo-100" : "bg-slate-100 text-slate-500"}`}>
                      {tabCounts[tab.key]}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden space-y-1 border-t border-slate-200 p-3 lg:block">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                ← View site
              </Link>
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />
          {activeTab === "overview" && renderOverview()}
          {activeTab === "questions" && renderQuestions()}
          {activeTab === "tests" && renderTests()}
          {activeTab === "interviews" && renderInterviews()}
          {activeTab === "users" && renderUsers()}
        </div>
      </main>

      <datalist id="exam-presets">
        {examPresetOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="question-categories">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
    </div>
  );
}
