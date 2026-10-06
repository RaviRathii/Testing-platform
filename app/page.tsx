"use client";

import { useState } from "react";
import { BackendStatus } from "@/components/backend-status";
import { examStageCatalog } from "@/lib/exam-data";

const governmentJobs = [
  "SSC",
  "Banking",
  "Railway",
  "UPSC",
  "State Government Exams",
];

const privateJobs = [
  "Software Development",
  "Java",
  "Python",
  "SQL",
  "Data Science",
  "Aptitude",
];

const comingSoon = [
  "Mock Tests",
  "Practice Questions",
  "Performance Analytics",
  "Personalized Preparation",
  "Leaderboards",
  "Detailed Results",
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

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<keyof typeof examByCategory>("SSC");

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
              M
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Mock Test Platform</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#categories" className="transition hover:text-slate-900">
              Categories
            </a>
            <a href="#coming-soon" className="transition hover:text-slate-900">
              Upcoming
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="/profile" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
              Profile
            </a>
            <a href="/login" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
              Login
            </a>
            <a href="/signup" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
              Sign up
            </a>
          </div>
        </div>
      </header>

      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 text-sm sm:px-6 lg:px-8">
          <p className="font-medium text-amber-900">
            Unlock our mock-test practice access for ₹49/month.
          </p>
          <a href="/signup" className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-500">
            Subscribe now
          </a>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              Exam readiness platform
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Mock Test Platform
            </h1>
            <p className="mt-4 text-xl font-medium text-indigo-600">Prepare smarter. Practice better.</p>
            <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
              Practice with structured mock tests and improve your exam preparation for
              government and private sector recruitment opportunities.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="/questions"
                className="rounded-full bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Explore Mock Tests
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70">
            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Preparation roadmap</p>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Weekly target</span>
                  <span className="font-semibold text-indigo-300">5 tests</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Practice score</span>
                  <span className="font-semibold text-indigo-300">85%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Current streak</span>
                  <span className="font-semibold text-indigo-300">12 days</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <BackendStatus />
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
            Categories
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Government & Private Job Exams</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {categoryOrder.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === category
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Selected category</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{activeCategory}</h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {examByCategory[activeCategory].map((exam) => (
                <div key={exam.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-slate-900">{exam.name}</p>
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                      {activeCategory}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">{exam.description}</p>

                  <div className="mt-4 space-y-2">
                    {exam.details.map((detail) => (
                      <div key={detail} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                        {detail}
                      </div>
                    ))}
                  </div>

                  {exam.notes && exam.notes.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700">Preparation notes</p>
                      <ul className="mt-2 space-y-2 text-sm text-slate-700">
                        {exam.notes.map((note) => (
                          <li key={note} className="flex items-start gap-2">
                            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
            Notes
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Preparation notes</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-lg font-semibold text-slate-900">Exam strategy</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Focus on targeted practice, section-wise timing, and revision cycles to improve accuracy before attempting full-length mock tests.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-lg font-semibold text-slate-900">Mock test approach</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Practice with sectional tests, mixed-topic sets, and stage-wise mock papers to build stamina and confidence for competitive exams.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-lg font-semibold text-slate-900">Progress tracking</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review weak areas after each attempt, improve speed, and repeat high-weight sections for consistent improvement across exam stages.
            </p>
          </div>
        </div>
      </section>

      <section id="coming-soon" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
            Upcoming features
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Coming Soon</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {comingSoon.map((feature) => (
            <div
              key={feature}
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">{feature}</h3>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                  Soon
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
