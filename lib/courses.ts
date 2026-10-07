// Course catalog. Courses are defined in code; their practice questions and mock tests are
// looked up at request time by matching question categories and mock test exam names.

export type Subject = {
  id: string;
  name: string;
  summary: string;
  topics: string[];
  /** Matches question bank categories that belong to this subject. */
  questionMatch: RegExp;
};

export const courseCategories = ["SSC", "Banking", "Railway", "UPSC", "State Government", "Engineering"] as const;
export type CourseCategory = (typeof courseCategories)[number];

export const categoryBlurbs: Record<CourseCategory, string> = {
  SSC: "Staff Selection Commission exams for central government posts.",
  Banking: "Public sector bank and RBI recruitment exams.",
  Railway: "Railway Recruitment Board exams for technical and non-technical posts.",
  UPSC: "Union Public Service Commission civil services and defence exams.",
  "State Government": "State-level public service, police, and teaching exams.",
  Engineering: "Programming, system design, and AI skills for engineering roles.",
};

export type Course = {
  slug: string;
  name: string;
  category: CourseCategory;
  description: string;
  /** Exam pattern or assessment format, one line per paper. */
  pattern: string[];
  subjects: Subject[];
  /** Matches mock test exam names or titles that belong to this course. */
  testMatch: RegExp;
};

const subjectLibrary = {
  quant: {
    name: "Quantitative Aptitude",
    summary: "Arithmetic, algebra, and geometry for speed and accuracy.",
    topics: ["Number System", "Percentages", "Ratio & Proportion", "Profit & Loss", "Simple & Compound Interest", "Time & Work", "Time, Speed & Distance", "Algebra", "Geometry & Mensuration"],
    questionMatch: /quant|arithmetic|math|numerical/i,
  },
  reasoning: {
    name: "Reasoning",
    summary: "Verbal, non-verbal, and analytical reasoning.",
    topics: ["Analogy", "Classification", "Series", "Coding-Decoding", "Blood Relations", "Direction Sense", "Syllogism", "Puzzles & Seating Arrangement", "Non-verbal Reasoning"],
    questionMatch: /reason|intelligence|logical/i,
  },
  english: {
    name: "English Language",
    summary: "Grammar, vocabulary, and reading comprehension.",
    topics: ["Reading Comprehension", "Error Spotting", "Fill in the Blanks", "Synonyms & Antonyms", "Idioms & Phrases", "One-word Substitution", "Active & Passive Voice", "Direct & Indirect Speech"],
    questionMatch: /english|verbal|vocabulary|grammar/i,
  },
  ga: {
    name: "General Awareness",
    summary: "Static GK, science, and current affairs.",
    topics: ["History", "Polity", "Geography", "Economy", "General Science", "Static GK", "Current Affairs"],
    questionMatch: /general awareness|\bgk\b|general knowledge|current affairs/i,
  },
  computer: {
    name: "Computer Awareness",
    summary: "Computer fundamentals and office productivity.",
    topics: ["Computer Fundamentals", "MS Office", "Internet & Email", "Networking Basics", "Keyboard Shortcuts", "Cyber Security Basics"],
    questionMatch: /computer/i,
  },
  typing: {
    name: "Skill & Typing Test",
    summary: "Typing speed and accuracy for the qualifying skill test.",
    topics: ["Typing Speed (English/Hindi)", "Accuracy Drills", "Data Entry Practice"],
    questionMatch: /typing|skill test|data entry/i,
  },
  steno: {
    name: "Stenography Skill Test",
    summary: "Dictation and transcription at exam speed.",
    topics: ["Shorthand Basics", "Dictation at 80–100 wpm", "Transcription Accuracy"],
    questionMatch: /steno|shorthand|dictation/i,
  },
  technical: {
    name: "Technical (Engineering)",
    summary: "Core engineering concepts for your discipline.",
    topics: ["Civil Engineering Fundamentals", "Mechanical Engineering Fundamentals", "Electrical Engineering Fundamentals", "Engineering Drawing", "Basic Electronics"],
    questionMatch: /technical|engineering/i,
  },
  banking: {
    name: "Banking & Financial Awareness",
    summary: "Banking terms, RBI policy, and the financial system.",
    topics: ["RBI & Monetary Policy", "Banking Terms & Products", "Financial Institutions", "Union Budget & Economic Survey", "Government Schemes", "Banking Current Affairs"],
    questionMatch: /bank|financial/i,
  },
  di: {
    name: "Data Interpretation & Analysis",
    summary: "Reading charts and tables quickly under time pressure.",
    topics: ["Tables", "Bar Graphs", "Pie Charts", "Line Graphs", "Caselets", "Data Sufficiency"],
    questionMatch: /data interpretation|data analysis/i,
  },
  descriptive: {
    name: "Descriptive Writing",
    summary: "Essays, letters, and precis for descriptive papers.",
    topics: ["Essay Writing", "Formal Letters", "Precis Writing", "Comprehension Answers"],
    questionMatch: /descriptive|essay/i,
  },
  economicSocial: {
    name: "Economic & Social Issues",
    summary: "Growth, development, and social sector policy.",
    topics: ["Growth & Development", "Inflation", "Poverty & Employment", "Globalisation", "Social Sector Schemes", "Indian Economy Current Affairs"],
    questionMatch: /econom|social issues/i,
  },
  finance: {
    name: "Finance & Management",
    summary: "Financial markets and management theory.",
    topics: ["Financial Markets", "Risk Management", "Derivatives Basics", "Leadership & Motivation", "Organisational Behaviour", "Corporate Governance"],
    questionMatch: /finance|management/i,
  },
  generalScience: {
    name: "General Science",
    summary: "Physics, chemistry, and biology up to class 10 level.",
    topics: ["Physics", "Chemistry", "Biology", "Environmental Science", "Everyday Science"],
    questionMatch: /science/i,
  },
  history: {
    name: "History & Culture",
    summary: "Ancient, medieval, and modern India, plus art and culture.",
    topics: ["Ancient India", "Medieval India", "Modern India & Freedom Struggle", "Art & Culture", "World History"],
    questionMatch: /histor|culture/i,
  },
  polity: {
    name: "Indian Polity & Governance",
    summary: "The Constitution, institutions, and governance.",
    topics: ["Constitution & Amendments", "Fundamental Rights & Duties", "Parliament & State Legislatures", "Judiciary", "Panchayati Raj", "Constitutional Bodies"],
    questionMatch: /polity|constitution|governance/i,
  },
  geography: {
    name: "Geography & Environment",
    summary: "Physical, Indian, and world geography with ecology.",
    topics: ["Physical Geography", "Indian Geography", "World Geography", "Climate & Monsoon", "Environment & Ecology", "Biodiversity & Conservation"],
    questionMatch: /geograph|environment|ecology/i,
  },
  economy: {
    name: "Indian Economy",
    summary: "Macroeconomics and the Indian economy.",
    topics: ["National Income", "Fiscal & Monetary Policy", "Banking & Inflation", "External Sector", "Agriculture & Industry", "Budget & Economic Survey"],
    questionMatch: /econom/i,
  },
  scienceTech: {
    name: "Science & Technology",
    summary: "Applied science and emerging technology.",
    topics: ["Space & Defence Technology", "Biotechnology", "IT & Computers", "Health & Diseases", "Emerging Technologies"],
    questionMatch: /science|technology/i,
  },
  currentAffairs: {
    name: "Current Affairs",
    summary: "National and international events from the last 12–18 months.",
    topics: ["National Events", "International Relations", "Government Schemes", "Awards & Appointments", "Sports", "Reports & Indices"],
    questionMatch: /current affairs/i,
  },
  csat: {
    name: "CSAT (Aptitude Test)",
    summary: "Comprehension, reasoning, and basic numeracy (qualifying).",
    topics: ["Reading Comprehension", "Logical Reasoning", "Analytical Ability", "Decision Making", "Basic Numeracy", "Data Interpretation"],
    questionMatch: /csat/i,
  },
  elementaryMath: {
    name: "Mathematics",
    summary: "School-level to class 12 mathematics.",
    topics: ["Algebra", "Trigonometry", "Matrices & Determinants", "Calculus", "Statistics & Probability", "Geometry"],
    questionMatch: /math/i,
  },
  stateGk: {
    name: "State GK",
    summary: "History, geography, and administration of your state.",
    topics: ["State History", "State Geography", "Art, Culture & Festivals", "State Economy", "State Administration", "State Current Affairs"],
    questionMatch: /state gk|state general/i,
  },
  pedagogy: {
    name: "Child Development & Pedagogy",
    summary: "Learning theories and inclusive teaching.",
    topics: ["Child Development", "Learning Theories", "Inclusive Education", "Assessment & Evaluation", "Teaching Methods"],
    questionMatch: /pedagogy|child development/i,
  },
  environment: {
    name: "Environment & Ecology",
    summary: "Forests, wildlife, and environmental laws.",
    topics: ["Forests & Wildlife", "Ecosystems", "Biodiversity", "Environmental Laws", "Climate Change"],
    questionMatch: /environment|ecology|forest/i,
  },
} satisfies Record<string, Omit<Subject, "id">>;

type SubjectKey = keyof typeof subjectLibrary;

const subjects = (...keys: SubjectKey[]): Subject[] => keys.map((key) => ({ id: key, ...subjectLibrary[key] }));

export const courses: Course[] = [
  // SSC
  {
    slug: "ssc-cgl",
    name: "SSC CGL",
    category: "SSC",
    description: "Combined Graduate Level exam for Group B and C posts in central ministries and departments.",
    pattern: ["Tier 1 • 100 Q • 60 min", "Tier 2 Paper 1 • 150 Q • Session-based"],
    subjects: subjects("quant", "reasoning", "english", "ga", "computer"),
    testMatch: /\bcgl\b/i,
  },
  {
    slug: "ssc-chsl",
    name: "SSC CHSL",
    category: "SSC",
    description: "Combined Higher Secondary Level exam for LDC, JSA, and DEO posts.",
    pattern: ["Tier 1 • 100 Q • 60 min", "Tier 2 • 135 Q • Session-based"],
    subjects: subjects("quant", "reasoning", "english", "ga", "computer", "typing"),
    testMatch: /chsl/i,
  },
  {
    slug: "ssc-mts",
    name: "SSC MTS",
    category: "SSC",
    description: "Multi-Tasking Staff and Havaldar recruitment for 10th-pass candidates.",
    pattern: ["Session 1 • 40 Q • 45 min", "Session 2 • 50 Q • 45 min"],
    subjects: subjects("quant", "reasoning", "english", "ga"),
    testMatch: /\bmts\b/i,
  },
  {
    slug: "ssc-gd-constable",
    name: "SSC GD Constable",
    category: "SSC",
    description: "General Duty Constable recruitment for CAPFs, SSF, and Assam Rifles.",
    pattern: ["Computer Based Exam • 80 Q • 60 min"],
    subjects: subjects("reasoning", "ga", "quant", "english"),
    testMatch: /\bgd\b/i,
  },
  {
    slug: "ssc-cpo",
    name: "SSC CPO",
    category: "SSC",
    description: "Sub-Inspector recruitment for Delhi Police and CAPFs.",
    pattern: ["Paper 1 • 200 Q • 2 hours", "Paper 2 • 200 Q • 2 hours"],
    subjects: subjects("reasoning", "ga", "quant", "english"),
    testMatch: /\bcpo\b/i,
  },
  {
    slug: "ssc-je",
    name: "SSC JE",
    category: "SSC",
    description: "Junior Engineer recruitment in civil, mechanical, and electrical disciplines.",
    pattern: ["Paper 1 • 200 Q • 2 hours"],
    subjects: subjects("reasoning", "ga", "technical"),
    testMatch: /ssc\s*je\b/i,
  },
  {
    slug: "ssc-stenographer",
    name: "SSC Stenographer",
    category: "SSC",
    description: "Stenographer Grade C and D recruitment with a skill test.",
    pattern: ["Computer Based Exam • 200 Q • 2 hours"],
    subjects: subjects("reasoning", "ga", "english", "steno"),
    testMatch: /steno/i,
  },
  {
    slug: "ssc-selection-post",
    name: "SSC Selection Post",
    category: "SSC",
    description: "Post-specific recruitment at matriculation, higher secondary, and graduate levels.",
    pattern: ["Matriculation • 100 Q • 60 min", "Higher Secondary • 100 Q • 60 min", "Graduate • 100 Q • 60 min"],
    subjects: subjects("reasoning", "ga", "quant", "english"),
    testMatch: /selection post/i,
  },

  // Banking
  {
    slug: "ibps-po",
    name: "IBPS PO",
    category: "Banking",
    description: "Probationary Officer recruitment for public sector banks.",
    pattern: ["Prelims • 100 Q • 60 min", "Mains • 225 Q • 3 hours"],
    subjects: subjects("quant", "reasoning", "english", "di", "banking", "computer", "descriptive"),
    testMatch: /ibps\s*po/i,
  },
  {
    slug: "ibps-clerk",
    name: "IBPS Clerk",
    category: "Banking",
    description: "Clerical cadre recruitment for public sector banks.",
    pattern: ["Prelims • 100 Q • 60 min", "Mains • 190 Q • 160 min"],
    subjects: subjects("quant", "reasoning", "english", "banking", "computer"),
    testMatch: /ibps\s*clerk/i,
  },
  {
    slug: "sbi-po",
    name: "SBI PO",
    category: "Banking",
    description: "Probationary Officer recruitment for the State Bank of India.",
    pattern: ["Prelims • 100 Q • 60 min", "Mains • 155 Q • 3 hours"],
    subjects: subjects("quant", "reasoning", "english", "di", "banking", "computer", "descriptive"),
    testMatch: /sbi\s*po/i,
  },
  {
    slug: "sbi-clerk",
    name: "SBI Clerk",
    category: "Banking",
    description: "Junior Associate recruitment for the State Bank of India.",
    pattern: ["Prelims • 100 Q • 60 min", "Mains • 190 Q • 160 min"],
    subjects: subjects("quant", "reasoning", "english", "banking", "computer"),
    testMatch: /sbi\s*clerk/i,
  },
  {
    slug: "rbi-grade-b",
    name: "RBI Grade B",
    category: "Banking",
    description: "Officer recruitment for the Reserve Bank of India.",
    pattern: ["Phase 1 • 200 Q • 120 min", "Phase 2 • 3 papers"],
    subjects: subjects("banking", "economicSocial", "finance", "reasoning", "english", "quant"),
    testMatch: /\brbi\b/i,
  },
  {
    slug: "ibps-rrb",
    name: "IBPS RRB",
    category: "Banking",
    description: "Officer and Office Assistant recruitment for Regional Rural Banks.",
    pattern: ["Prelims • 80 Q • 45 min", "Mains • 200 Q • 2 hours"],
    subjects: subjects("quant", "reasoning", "english", "banking", "computer"),
    testMatch: /ibps\s*rrb/i,
  },

  // Railway
  {
    slug: "rrb-ntpc",
    name: "RRB NTPC",
    category: "Railway",
    description: "Non-Technical Popular Categories, including station master and clerk posts.",
    pattern: ["CBT 1 • 100 Q • 90 min", "CBT 2 • 120 Q • 90 min"],
    subjects: subjects("quant", "reasoning", "ga"),
    testMatch: /ntpc/i,
  },
  {
    slug: "rrb-group-d",
    name: "RRB Group D",
    category: "Railway",
    description: "Level 1 posts such as track maintainer, helper, and assistant.",
    pattern: ["Computer Based Test • 100 Q • 90 min"],
    subjects: subjects("quant", "reasoning", "generalScience", "ga"),
    testMatch: /group\s*d\b/i,
  },
  {
    slug: "rrb-je",
    name: "RRB JE",
    category: "Railway",
    description: "Junior Engineer, depot material superintendent, and chemical assistant posts.",
    pattern: ["CBT 1 • 100 Q • 90 min", "CBT 2 • 150 Q • 120 min"],
    subjects: subjects("quant", "reasoning", "ga", "generalScience", "technical"),
    testMatch: /rrb\s*je\b/i,
  },
  {
    slug: "rrb-alp",
    name: "RRB ALP",
    category: "Railway",
    description: "Assistant Loco Pilot recruitment.",
    pattern: ["CBT 1 • 75 Q • 60 min", "CBT 2 • 175 Q • 150 min"],
    subjects: subjects("quant", "reasoning", "generalScience", "ga", "technical"),
    testMatch: /\balp\b/i,
  },
  {
    slug: "rrb-technician",
    name: "RRB Technician",
    category: "Railway",
    description: "Technician Grade I and III recruitment.",
    pattern: ["Computer Based Test • 100 Q • 90 min"],
    subjects: subjects("quant", "reasoning", "generalScience", "ga", "technical"),
    testMatch: /technician/i,
  },
  {
    slug: "railway-general",
    name: "Railway General Preparation",
    category: "Railway",
    description: "Common syllabus shared across railway recruitment exams.",
    pattern: ["Multiple stage patterns"],
    subjects: subjects("quant", "reasoning", "ga", "generalScience"),
    testMatch: /railway/i,
  },

  // UPSC
  {
    slug: "upsc-cse-prelims",
    name: "UPSC CSE Prelims",
    category: "UPSC",
    description: "Civil Services preliminary exam for IAS, IPS, IFS, and allied services.",
    pattern: ["GS Paper 1 • 100 Q • 2 hours", "CSAT Paper 2 • 80 Q • 2 hours"],
    subjects: subjects("history", "polity", "geography", "economy", "scienceTech", "currentAffairs", "csat"),
    testMatch: /\bcse\b|civil services/i,
  },
  {
    slug: "upsc-cds",
    name: "UPSC CDS",
    category: "UPSC",
    description: "Combined Defence Services exam for IMA, INA, AFA, and OTA.",
    pattern: ["English • 120 Q • 2 hours", "General Knowledge • 120 Q • 2 hours", "Elementary Mathematics • 100 Q • 2 hours"],
    subjects: subjects("english", "ga", "elementaryMath"),
    testMatch: /\bcds\b/i,
  },
  {
    slug: "upsc-capf",
    name: "UPSC CAPF",
    category: "UPSC",
    description: "Assistant Commandant recruitment for the Central Armed Police Forces.",
    pattern: ["Paper 1 • 125 Q • 2 hours", "Paper 2 • Descriptive • 3 hours"],
    subjects: subjects("reasoning", "ga", "currentAffairs", "descriptive"),
    testMatch: /capf/i,
  },
  {
    slug: "upsc-ifs",
    name: "UPSC IFoS",
    category: "UPSC",
    description: "Indian Forest Service exam, with prelims shared with the Civil Services.",
    pattern: ["Prelims • GS 100 Q + CSAT 80 Q", "Mains • Forestry-specific papers"],
    subjects: subjects("history", "polity", "geography", "economy", "environment", "currentAffairs", "csat"),
    testMatch: /\bifo?s\b|forest service/i,
  },
  {
    slug: "upsc-nda",
    name: "UPSC NDA",
    category: "UPSC",
    description: "National Defence Academy and Naval Academy entrance exam.",
    pattern: ["Mathematics • 120 Q • 2.5 hours", "General Ability Test • 150 Q • 2.5 hours"],
    subjects: subjects("elementaryMath", "english", "generalScience", "ga"),
    testMatch: /\bnda\b/i,
  },

  // State Government
  {
    slug: "state-psc",
    name: "State PSC",
    category: "State Government",
    description: "State civil services exams conducted by state public service commissions.",
    pattern: ["Prelims • 100–150 Q • 2 hours"],
    subjects: subjects("stateGk", "history", "polity", "geography", "currentAffairs", "csat"),
    testMatch: /\bpsc\b/i,
  },
  {
    slug: "police-constable",
    name: "Police Constable",
    category: "State Government",
    description: "State police constable recruitment written exams.",
    pattern: ["Objective exam • 80–150 Q • 60–120 min"],
    subjects: subjects("reasoning", "ga", "quant", "stateGk"),
    testMatch: /police/i,
  },
  {
    slug: "forest-guard",
    name: "Forest Guard",
    category: "State Government",
    description: "State forest department guard and ranger recruitment.",
    pattern: ["Objective exam • 100 Q • 90 min"],
    subjects: subjects("ga", "reasoning", "quant", "environment"),
    testMatch: /forest guard/i,
  },
  {
    slug: "teaching-eligibility",
    name: "Teaching Eligibility (TET)",
    category: "State Government",
    description: "CTET and state TET papers for primary and upper-primary teachers.",
    pattern: ["Paper 1 • 150 Q • 2.5 hours", "Paper 2 • 150 Q • 2.5 hours"],
    subjects: subjects("pedagogy", "english", "quant", "generalScience"),
    testMatch: /\btet\b|teaching/i,
  },
  {
    slug: "clerk-recruitment",
    name: "State Clerk Recruitment",
    category: "State Government",
    description: "Clerk, typist, and junior assistant posts in state departments.",
    pattern: ["Objective exam • 100 Q • 60 min", "Typing test • Qualifying"],
    subjects: subjects("reasoning", "quant", "ga", "computer", "typing"),
    testMatch: /clerk recruitment|state clerk/i,
  },

  // Engineering
  {
    slug: "java",
    name: "Java",
    category: "Engineering",
    description: "Core Java through concurrency and the JVM, for backend engineering interviews.",
    pattern: ["Assessment • 25 Q • 30 min"],
    subjects: [
      { id: "core", name: "Core Java & OOP", summary: "Language fundamentals and object-oriented design.", topics: ["Types & Operators", "Classes & Objects", "Inheritance & Polymorphism", "Interfaces & Abstract Classes", "Exceptions", "Records & Enums"], questionMatch: /java/i },
      { id: "collections", name: "Collections & Generics", summary: "The collections framework and type-safe generics.", topics: ["List, Set & Map", "HashMap Internals", "Comparable & Comparator", "Generics & Wildcards", "Immutable Collections"], questionMatch: /java.*collection|collection/i },
      { id: "streams", name: "Streams & Functional Java", summary: "Lambdas and the Stream API.", topics: ["Lambdas", "Functional Interfaces", "Stream Operations", "Collectors", "Optional"], questionMatch: /stream|lambda/i },
      { id: "concurrency", name: "Concurrency", summary: "Threads, executors, and safe shared state.", topics: ["Threads & Runnables", "Synchronisation & Locks", "ExecutorService", "CompletableFuture", "Virtual Threads", "Concurrent Collections"], questionMatch: /concurren|thread/i },
      { id: "jvm", name: "JVM Internals", summary: "Memory, garbage collection, and performance.", topics: ["Class Loading", "Heap & Stack", "Garbage Collectors", "JIT Compilation", "Profiling"], questionMatch: /jvm|garbage/i },
      { id: "spring", name: "Spring Boot Essentials", summary: "Building REST services with Spring Boot.", topics: ["Dependency Injection", "REST Controllers", "Spring Data JPA", "Configuration & Profiles", "Testing"], questionMatch: /spring/i },
    ],
    testMatch: /\bjava\b/i,
  },
  {
    slug: "python",
    name: "Python",
    category: "Engineering",
    description: "Idiomatic Python from fundamentals to async, testing, and packaging.",
    pattern: ["Assessment • 30 Q • 40 min"],
    subjects: [
      { id: "fundamentals", name: "Python Fundamentals", summary: "Syntax, types, and control flow.", topics: ["Data Types", "Control Flow", "Functions & Arguments", "Modules & Imports", "Error Handling"], questionMatch: /python/i },
      { id: "data-structures", name: "Data Structures", summary: "Built-in collections and comprehensions.", topics: ["Lists & Tuples", "Dictionaries & Sets", "Comprehensions", "collections Module", "Time Complexity"], questionMatch: /python.*data structure|data structure/i },
      { id: "oop", name: "OOP in Python", summary: "Classes, dunder methods, and dataclasses.", topics: ["Classes & Inheritance", "Dunder Methods", "Properties", "Dataclasses", "Protocols & ABCs"], questionMatch: /python.*oop|\boop\b/i },
      { id: "advanced", name: "Iterators, Generators & Decorators", summary: "The features that make Python expressive.", topics: ["Iterators & Iterables", "Generators", "Decorators", "Context Managers", "Type Hints"], questionMatch: /generator|decorator/i },
      { id: "async", name: "Async & Concurrency", summary: "asyncio, threads, and processes.", topics: ["asyncio Basics", "Tasks & Gather", "Threading vs Multiprocessing", "The GIL"], questionMatch: /asyncio|async/i },
      { id: "testing", name: "Testing & Packaging", summary: "Shipping reliable Python code.", topics: ["pytest", "Mocking", "Virtual Environments", "Packaging with pyproject.toml"], questionMatch: /pytest|packaging/i },
    ],
    testMatch: /python/i,
  },
  {
    slug: "go",
    name: "Go",
    category: "Engineering",
    description: "Go for backend services: types, interfaces, concurrency, and tooling.",
    pattern: ["Assessment • 25 Q • 30 min"],
    subjects: [
      { id: "basics", name: "Go Basics", summary: "Syntax, types, and the standard toolchain.", topics: ["Variables & Types", "Slices & Maps", "Functions & Closures", "Pointers", "go build, run & fmt"], questionMatch: /\bgo(lang)?\b/i },
      { id: "types", name: "Structs, Methods & Interfaces", summary: "Composition over inheritance.", topics: ["Structs & Embedding", "Methods & Receivers", "Interfaces", "Type Assertions & Switches", "Generics"], questionMatch: /golang.*interface/i },
      { id: "errors", name: "Error Handling", summary: "Idiomatic errors in Go.", topics: ["The error Interface", "Wrapping & errors.Is/As", "Sentinel Errors", "panic & recover"], questionMatch: /golang.*error/i },
      { id: "concurrency", name: "Goroutines & Channels", summary: "Go's concurrency model.", topics: ["Goroutines", "Channels & select", "sync Package", "Context & Cancellation", "Worker Pools"], questionMatch: /goroutine|channel/i },
      { id: "modules", name: "Packages & Modules", summary: "Organising and versioning Go code.", topics: ["Packages & Visibility", "Go Modules", "Project Layout", "Dependency Management"], questionMatch: /go module/i },
      { id: "testing", name: "Testing & Profiling", summary: "Built-in testing and performance tools.", topics: ["testing Package", "Table-driven Tests", "Benchmarks", "pprof"], questionMatch: /golang.*test|pprof/i },
    ],
    testMatch: /\bgo(lang)?\b/i,
  },
  {
    slug: "system-design",
    name: "System Design",
    category: "Engineering",
    description: "Designing scalable, reliable systems for senior engineering interviews.",
    pattern: ["Assessment • 20 Q • 45 min", "Design case study • 1 round"],
    subjects: [
      { id: "fundamentals", name: "Fundamentals", summary: "The vocabulary of scalable systems.", topics: ["Scalability", "Latency vs Throughput", "Availability & SLAs", "CAP Theorem", "Back-of-the-envelope Estimation"], questionMatch: /system design/i },
      { id: "building-blocks", name: "Building Blocks", summary: "The components most designs are built from.", topics: ["Load Balancers", "Caching & CDNs", "Message Queues", "Object Storage", "API Gateways"], questionMatch: /load balanc|cach|queue/i },
      { id: "data", name: "Databases at Scale", summary: "Storing and serving data reliably.", topics: ["SQL vs NoSQL", "Indexing", "Replication", "Sharding & Partitioning", "Consistent Hashing"], questionMatch: /sharding|replication/i },
      { id: "distributed", name: "Distributed Systems", summary: "Correctness when machines fail.", topics: ["Consistency Models", "Consensus (Raft)", "Idempotency", "Distributed Transactions", "Rate Limiting"], questionMatch: /distributed/i },
      { id: "api", name: "API Design", summary: "Clean, evolvable interfaces.", topics: ["REST & gRPC", "Pagination", "Versioning", "Authentication", "Webhooks"], questionMatch: /api design/i },
      { id: "case-studies", name: "Case Studies", summary: "Classic design interview problems.", topics: ["URL Shortener", "Chat System", "News Feed", "Rate Limiter", "Video Streaming"], questionMatch: /case stud/i },
    ],
    testMatch: /system design/i,
  },
  {
    slug: "ai-engineering",
    name: "AI Engineering",
    category: "Engineering",
    description: "Building production applications on large language models.",
    pattern: ["Assessment • 25 Q • 40 min"],
    subjects: [
      { id: "foundations", name: "ML & LLM Foundations", summary: "How modern language models work.", topics: ["ML Basics", "Neural Networks", "Transformers & Attention", "Tokens & Context Windows", "Fine-tuning vs Prompting"], questionMatch: /\bai\b|llm|machine learning/i },
      { id: "prompting", name: "Prompt Engineering", summary: "Getting reliable output from models.", topics: ["System Prompts", "Few-shot Examples", "Structured Output", "Chain-of-thought", "Prompt Injection"], questionMatch: /prompt/i },
      { id: "rag", name: "Embeddings & RAG", summary: "Grounding models in your own data.", topics: ["Embeddings", "Vector Databases", "Chunking Strategies", "Retrieval-Augmented Generation", "Reranking"], questionMatch: /embedding|\brag\b|vector/i },
      { id: "agents", name: "Agents & Tool Use", summary: "Models that take actions.", topics: ["Tool / Function Calling", "Agent Loops", "Memory", "Multi-agent Patterns", "MCP"], questionMatch: /agent|tool use/i },
      { id: "evaluation", name: "Evaluation", summary: "Measuring quality before and after launch.", topics: ["Eval Datasets", "LLM-as-judge", "Regression Testing", "Human Review", "Monitoring"], questionMatch: /evaluation|\bevals?\b/i },
      { id: "production", name: "Deployment, Cost & Safety", summary: "Running AI features in production.", topics: ["Latency & Streaming", "Caching & Cost Control", "Guardrails", "Privacy & Data Handling", "Observability"], questionMatch: /guardrail|ai safety/i },
    ],
    testMatch: /\bai\b|artificial intelligence|llm/i,
  },
  {
    slug: "sql",
    name: "SQL",
    category: "Engineering",
    description: "Writing correct, fast queries and designing relational schemas.",
    pattern: ["Assessment • 25 Q • 30 min"],
    subjects: [
      { id: "querying", name: "Querying Basics", summary: "Selecting, filtering, and sorting data.", topics: ["SELECT & WHERE", "ORDER BY & LIMIT", "NULL Handling", "CASE Expressions"], questionMatch: /\bsql\b/i },
      { id: "joins", name: "Joins & Subqueries", summary: "Combining data across tables.", topics: ["Inner & Outer Joins", "Self Joins", "Subqueries", "CTEs", "EXISTS vs IN"], questionMatch: /\bjoins?\b|subquer/i },
      { id: "aggregation", name: "Aggregation & Window Functions", summary: "Summaries and analytics in SQL.", topics: ["GROUP BY & HAVING", "Aggregate Functions", "ROW_NUMBER & RANK", "Running Totals", "PARTITION BY"], questionMatch: /window function|aggregat/i },
      { id: "performance", name: "Indexes & Query Plans", summary: "Making queries fast.", topics: ["B-tree Indexes", "Composite Indexes", "EXPLAIN Plans", "Query Optimisation"], questionMatch: /\bindex(es|ing)?\b|query plan/i },
      { id: "transactions", name: "Transactions", summary: "Keeping data consistent under concurrency.", topics: ["ACID", "Isolation Levels", "Locking", "Deadlocks"], questionMatch: /transaction|isolation/i },
      { id: "design", name: "Schema Design", summary: "Modelling data relationally.", topics: ["Normalisation", "Keys & Constraints", "One-to-many & Many-to-many", "DDL & DML"], questionMatch: /schema|normali/i },
    ],
    testMatch: /\bsql\b/i,
  },
  {
    slug: "data-science",
    name: "Data Science",
    category: "Engineering",
    description: "Statistics, data wrangling, and machine learning for analytics roles.",
    pattern: ["Assessment • 20 Q • 30 min"],
    subjects: [
      { id: "statistics", name: "Statistics & Probability", summary: "The maths behind data analysis.", topics: ["Descriptive Statistics", "Probability Distributions", "Hypothesis Testing", "Confidence Intervals", "A/B Testing"], questionMatch: /statistic|probabilit/i },
      { id: "wrangling", name: "Data Wrangling", summary: "Cleaning and shaping data with Python.", topics: ["NumPy", "pandas DataFrames", "Missing Data", "Joins & Reshaping", "Feature Engineering"], questionMatch: /pandas|numpy|data science/i },
      { id: "visualisation", name: "Data Visualisation", summary: "Communicating insights clearly.", topics: ["Chart Selection", "Matplotlib & Seaborn", "Dashboards", "Storytelling with Data"], questionMatch: /visuali/i },
      { id: "ml", name: "Machine Learning", summary: "Supervised and unsupervised learning.", topics: ["Linear & Logistic Regression", "Decision Trees & Ensembles", "Clustering", "Train/Test Splits", "Overfitting"], questionMatch: /machine learning/i },
      { id: "evaluation", name: "Model Evaluation", summary: "Knowing whether a model is any good.", topics: ["Accuracy, Precision & Recall", "ROC & AUC", "Cross-validation", "Bias & Fairness"], questionMatch: /model evaluation/i },
    ],
    testMatch: /data science/i,
  },
];

export const getCourse = (slug: string) => courses.find((course) => course.slug === slug);

export const coursesByCategory = (category: CourseCategory) => courses.filter((course) => course.category === category);

export const countTopics = (course: Course) => course.subjects.reduce((total, subject) => total + subject.topics.length, 0);
