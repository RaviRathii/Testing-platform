"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

const defaultQuestionForm = {
  category: "CGL General Awareness",
  difficulty: "MEDIUM",
  questionText: "Who was the first Governor-General of independent India?",
  optionA: "C. Rajagopalachari",
  optionB: "Lord Mountbatten",
  optionC: "Dr. Rajendra Prasad",
  optionD: "Jawaharlal Nehru",
  correctOption: 1,
  explanation: "Lord Mountbatten served as the first Governor-General of independent India.",
};

const defaultTestForm = {
  title: "SSC CGL 2025 - Recent Shift Mock Test",
  examName: "CGL",
  description: "Recent shift-style mock practice for SSC CGL with aptitude, reasoning, and GK questions.",
  durationMinutes: 60,
  isPublished: true,
};

const defaultCsvImportForm = {
  category: "CGL General Awareness",
  difficulty: "MEDIUM",
  title: "SSC CGL CSV Mock Test",
  examName: "CGL",
  durationMinutes: 60,
  isPublished: true,
};

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "questions", label: "Questions" },
  { key: "tests", label: "Mock tests" },
  { key: "users", label: "Users" },
] as const;

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tests, setTests] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [questionMessage, setQuestionMessage] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionForm, setQuestionForm] = useState(defaultQuestionForm);
  const [testForm, setTestForm] = useState(defaultTestForm);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImportForm, setCsvImportForm] = useState(defaultCsvImportForm);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvMessage, setCsvMessage] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("overview");
  const [userSearch, setUserSearch] = useState("");
  const [userAccessFilter, setUserAccessFilter] = useState<"all" | "admin" | "user">("all");

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalQuestions: questions.length,
      totalTests: tests.length,
      activePaidUsers: users.filter((user) => user.subscription?.plan && user.subscription.plan !== "FREE").length,
      publishedTests: tests.filter((test) => test.isPublished).length,
      adminUsers: users.filter((user) => user.isAdmin).length,
    }),
    [questions, tests, users],
  );

  const loadAdminData = async () => {
    try {
      const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
      if (!meResponse.ok) {
        setIsAdmin(false);
        return;
      }

      const meData = (await meResponse.json()) as { user?: { isAdmin?: boolean } };
      if (!meData.user?.isAdmin) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(true);

      const [questionsResponse, usersResponse, testsResponse] = await Promise.all([
        fetch("/api/admin/questions", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/admin/tests", { cache: "no-store" }),
      ]);

      if (questionsResponse.ok) {
        setQuestions((await questionsResponse.json()) as QuestionRow[]);
      }

      if (usersResponse.ok) {
        setUsers((await usersResponse.json()) as UserRow[]);
      }

      if (testsResponse.ok) {
        setTests((await testsResponse.json()) as TestRow[]);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleQuestionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingQuestion(true);
    setQuestionMessage("");

    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: questionForm.category,
          difficulty: questionForm.difficulty,
          questionText: questionForm.questionText,
          options: [
            questionForm.optionA,
            questionForm.optionB,
            questionForm.optionC,
            questionForm.optionD,
          ],
          correctOption: questionForm.correctOption,
          explanation: questionForm.explanation,
          isActive: true,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save the question");
      }

      setQuestionMessage("Question added successfully.");
      setQuestionForm({
        ...defaultQuestionForm,
        category: questionForm.category,
      });
      setActiveTab("questions");
      await loadAdminData();
    } catch (error) {
      setQuestionMessage(error instanceof Error ? error.message : "Unable to save the question.");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleTestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingTest(true);
    setTestMessage("");

    if (selectedQuestionIds.length === 0) {
      setTestMessage("Select at least one question to build the mock test.");
      setSubmittingTest(false);
      return;
    }

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

      setTestMessage("Mock test created successfully.");
      setSelectedQuestionIds([]);
      setTestForm(defaultTestForm);
      setActiveTab("tests");
      await loadAdminData();
    } catch (error) {
      setTestMessage(error instanceof Error ? error.message : "Unable to create mock test.");
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleCsvImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!csvFile) {
      setCsvMessage("Please choose a CSV file to import.");
      return;
    }

    setCsvImporting(true);
    setCsvMessage("");

    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("category", csvImportForm.category);
      formData.append("difficulty", csvImportForm.difficulty);
      formData.append("title", csvImportForm.title);
      formData.append("examName", csvImportForm.examName);
      formData.append("durationMinutes", String(csvImportForm.durationMinutes));
      formData.append("isPublished", String(csvImportForm.isPublished));

      const response = await fetch("/api/admin/questions/import", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { error?: string; created?: number; test?: { id?: string; title?: string; questionCount?: number } };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to import the CSV file.");
      }

      setCsvMessage(
        data.test
          ? `Imported ${data.created ?? 0} questions and created “${data.test.title ?? csvImportForm.title}” with ${data.test.questionCount ?? 0} questions.`
          : `Imported ${data.created ?? 0} questions successfully.`,
      );
      setCsvFile(null);
      setCsvImportForm(defaultCsvImportForm);
      setActiveTab("questions");
      await loadAdminData();
    } catch (error) {
      setCsvMessage(error instanceof Error ? error.message : "Unable to import CSV questions.");
    } finally {
      setCsvImporting(false);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((item) => item !== questionId)
        : [...current, questionId],
    );
  };

  if (loading) {
    return <main className="min-h-screen bg-slate-100 p-8 text-slate-900">Loading admin dashboard...</main>;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
        <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-lg font-semibold">Admin access required</p>
          <a href="/login" className="mt-4 inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            Login as admin
          </a>
        </div>
      </main>
    );
  }

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total users", value: stats.totalUsers, accent: "indigo" },
          { label: "Questions", value: stats.totalQuestions, accent: "emerald" },
          { label: "Mock tests", value: stats.totalTests, accent: "amber" },
          { label: "Paid users", value: stats.activePaidUsers, accent: "violet" },
          { label: "Admins", value: stats.adminUsers, accent: "sky" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Quick actions</h2>
          <div className="mt-5 space-y-3">
            <button type="button" onClick={() => setActiveTab("questions")} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
              <p className="text-sm font-semibold text-slate-900">Add new question</p>
              <p className="mt-1 text-xs text-slate-500">Create question bank items for SSC, CGL, banking, aptitude, and reasoning.</p>
            </button>
            <button type="button" onClick={() => setActiveTab("tests")} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
              <p className="text-sm font-semibold text-slate-900">Build mock test</p>
              <p className="mt-1 text-xs text-slate-500">Assemble a full exam paper by selecting from the question bank.</p>
            </button>
            <button type="button" onClick={() => setActiveTab("users")} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
              <p className="text-sm font-semibold text-slate-900">Manage users</p>
              <p className="mt-1 text-xs text-slate-500">Track registrations, subscription plan status, and access levels.</p>
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Recent question bank</h2>
          <div className="mt-5 space-y-3">
            {questions.slice(0, 4).map((question) => (
              <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">{question.category}</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{question.questionText}</p>
                <p className="mt-1 text-xs text-slate-500">{question.difficulty}</p>
              </div>
            ))}
            {questions.length === 0 ? <p className="text-sm text-slate-500">No questions added yet.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuestions = () => (
    <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Add a question</h2>
        <form onSubmit={handleQuestionSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Category
              <input
                value={questionForm.category}
                onChange={(event) => setQuestionForm({ ...questionForm, category: event.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Difficulty
              <select
                value={questionForm.difficulty}
                onChange={(event) => setQuestionForm({ ...questionForm, difficulty: event.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Question
            <textarea
              value={questionForm.questionText}
              onChange={(event) => setQuestionForm({ ...questionForm, questionText: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              rows={3}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["optionA", "Option A"],
              ["optionB", "Option B"],
              ["optionC", "Option C"],
              ["optionD", "Option D"],
            ].map(([key, label]) => (
              <label key={key} className="space-y-2 text-sm font-medium text-slate-700">
                {label}
                <input
                  value={questionForm[key as keyof typeof questionForm] as string}
                  onChange={(event) => setQuestionForm({ ...questionForm, [key]: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
                />
              </label>
            ))}
          </div>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Correct option
            <select
              value={questionForm.correctOption}
              onChange={(event) => setQuestionForm({ ...questionForm, correctOption: Number(event.target.value) })}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
            >
              <option value={0}>Option A</option>
              <option value={1}>Option B</option>
              <option value={2}>Option C</option>
              <option value={3}>Option D</option>
            </select>
          </label>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Explanation
            <textarea
              value={questionForm.explanation}
              onChange={(event) => setQuestionForm({ ...questionForm, explanation: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              rows={3}
            />
          </label>

          {questionMessage ? <p className="text-sm font-medium text-emerald-700">{questionMessage}</p> : null}

          <button
            type="submit"
            disabled={submittingQuestion}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submittingQuestion ? "Saving question..." : "Add question"}
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Upload CSV questions</h2>
            <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">Bulk import</span>
          </div>

          <form onSubmit={handleCsvImport} className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Default category
                <input
                  value={csvImportForm.category}
                  onChange={(event) => setCsvImportForm({ ...csvImportForm, category: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Default difficulty
                <select
                  value={csvImportForm.difficulty}
                  onChange={(event) => setCsvImportForm({ ...csvImportForm, difficulty: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Mock test title
                <input
                  value={csvImportForm.title}
                  onChange={(event) => setCsvImportForm({ ...csvImportForm, title: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Exam name
                <input
                  list="exam-presets"
                  value={csvImportForm.examName}
                  onChange={(event) => setCsvImportForm({ ...csvImportForm, examName: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
                />
                <datalist id="exam-presets">
                  {examPresetOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Duration (minutes)
                <input
                  type="number"
                  min={15}
                  max={300}
                  value={csvImportForm.durationMinutes}
                  onChange={(event) => setCsvImportForm({ ...csvImportForm, durationMinutes: Number(event.target.value) })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
                />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={csvImportForm.isPublished}
                  onChange={(event) => setCsvImportForm({ ...csvImportForm, isPublished: event.target.checked })}
                />
                Publish immediately
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              Select CSV file
              <input
                type="file"
                accept=".csv"
                onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600"
              />
            </label>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-xs text-indigo-700">
              Required columns: <span className="font-semibold">questionText, optionA, optionB, optionC, optionD, correctOption</span>
              <br />
              Optional: <span className="font-semibold">category, difficulty, explanation</span>
            </div>

            {csvMessage ? <p className="text-sm font-medium text-emerald-700">{csvMessage}</p> : null}

            <button
              type="submit"
              disabled={csvImporting || !csvFile}
              className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {csvImporting ? "Importing questions..." : "Import CSV questions"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Question bank</h2>
          <div className="mt-5 space-y-3">
            {questions.length === 0 ? (
              <p className="text-sm text-slate-500">No questions available yet.</p>
            ) : (
              questions.slice(0, 8).map((question) => (
                <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">{question.category}</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">{question.questionText}</p>
                  <p className="mt-2 text-xs text-slate-500">{question.difficulty}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTests = () => (
    <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Create mock test</h2>
        <form onSubmit={handleTestSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Test title
              <input
                value={testForm.title}
                onChange={(event) => setTestForm({ ...testForm, title: event.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Exam name
              <input
                list="exam-presets"
                value={testForm.examName}
                onChange={(event) => setTestForm({ ...testForm, examName: event.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              />
              <datalist id="exam-presets">
                {examPresetOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Description
            <textarea
              value={testForm.description}
              onChange={(event) => setTestForm({ ...testForm, description: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              rows={3}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Duration (minutes)
              <input
                type="number"
                min={15}
                max={300}
                value={testForm.durationMinutes}
                onChange={(event) => setTestForm({ ...testForm, durationMinutes: Number(event.target.value) })}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={testForm.isPublished}
                onChange={(event) => setTestForm({ ...testForm, isPublished: event.target.checked })}
              />
              Publish immediately
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Select questions</p>
              <span className="text-xs text-slate-500">{selectedQuestionIds.length} chosen</span>
            </div>

            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {questions.length === 0 ? (
                <p className="text-sm text-slate-500">No questions available yet.</p>
              ) : (
                questions.map((question) => (
                  <label key={question.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <input
                      type="checkbox"
                      checked={selectedQuestionIds.includes(question.id)}
                      onChange={() => toggleQuestionSelection(question.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">{question.category}</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{question.questionText}</p>
                      <p className="mt-1 text-xs text-slate-500">{question.difficulty}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {testMessage ? <p className="text-sm font-medium text-emerald-700">{testMessage}</p> : null}

          <button
            type="submit"
            disabled={submittingTest}
            className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submittingTest ? "Creating test..." : "Create mock test"}
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Published mock tests</h2>
        <div className="mt-5 space-y-3">
          {tests.length === 0 ? (
            <p className="text-sm text-slate-500">No mock tests created yet.</p>
          ) : (
            tests.slice(0, 6).map((test) => (
              <div key={test.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{test.title}</p>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                    {test.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{test.examName}</p>
                <p className="mt-1 text-xs text-slate-500">{test.questionCount} questions • {test.durationMinutes} mins</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">User management</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder="Search users"
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <select
            value={userAccessFilter}
            onChange={(event) => setUserAccessFilter(event.target.value as "all" | "admin" | "user")}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="all">All access</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Access</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {users.length === 0 ? "No users yet." : "No matching users found."}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.subscription?.plan ?? "FREE"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        user.subscription?.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {user.subscription?.status ?? "ACTIVE"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isAdmin ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-700">Admin</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">User</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Admin portal</p>
            <h1 className="mt-2 text-3xl font-bold">Mock Test Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/questions" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              Practice area
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "overview" && renderOverview()}
        {activeTab === "questions" && renderQuestions()}
        {activeTab === "tests" && renderTests()}
        {activeTab === "users" && renderUsers()}
      </div>
    </main>
  );
}
