export type ExamStageInfo = {
  exam: string;
  stage: string;
  mockTestLabel: string;
  questions: string;
  duration: string;
  mode: string;
};

export const examStageCatalog: ExamStageInfo[] = [
  {
    exam: "SSC CGL",
    stage: "Tier 1",
    mockTestLabel: "Tier 1",
    questions: "100",
    duration: "60 min",
    mode: "Objective",
  },
  {
    exam: "SSC CGL",
    stage: "Tier 2 Paper 1",
    mockTestLabel: "Tier 2 Paper 1",
    questions: "150 objective + Computer/DEST components",
    duration: "Session-based",
    mode: "Objective + Computer/DEST",
  },
  {
    exam: "SSC CHSL",
    stage: "Tier 1",
    mockTestLabel: "Tier 1",
    questions: "100",
    duration: "60 min",
    mode: "Objective",
  },
  {
    exam: "SSC CHSL",
    stage: "Tier 2",
    mockTestLabel: "Tier 2",
    questions: "135 objective + Computer/Skill/Typing components",
    duration: "Session-based",
    mode: "Objective + Computer/Skill/Typing",
  },
  {
    exam: "SSC MTS",
    stage: "Session 1",
    mockTestLabel: "Session 1",
    questions: "40",
    duration: "45 min",
    mode: "Objective",
  },
  {
    exam: "SSC MTS",
    stage: "Session 2",
    mockTestLabel: "Session 2",
    questions: "50",
    duration: "45 min",
    mode: "Objective",
  },
  {
    exam: "SSC GD Constable",
    stage: "Computer Based Exam",
    mockTestLabel: "Computer Based Exam",
    questions: "80",
    duration: "60 min",
    mode: "Objective",
  },
  {
    exam: "SSC CPO",
    stage: "Paper 1",
    mockTestLabel: "Paper 1",
    questions: "200",
    duration: "2 hours",
    mode: "Objective",
  },
  {
    exam: "SSC CPO",
    stage: "Paper 2",
    mockTestLabel: "Paper 2",
    questions: "200",
    duration: "2 hours",
    mode: "Objective",
  },
  {
    exam: "SSC JE",
    stage: "Paper 1",
    mockTestLabel: "Paper 1",
    questions: "200",
    duration: "2 hours",
    mode: "Objective",
  },
  {
    exam: "SSC Stenographer",
    stage: "Computer Based Exam",
    mockTestLabel: "Computer Based Exam",
    questions: "200",
    duration: "2 hours",
    mode: "Objective",
  },
  {
    exam: "SSC Selection Post",
    stage: "Matriculation Level",
    mockTestLabel: "Matriculation Level",
    questions: "100",
    duration: "60 min",
    mode: "Objective",
  },
  {
    exam: "SSC Selection Post",
    stage: "Higher Secondary Level",
    mockTestLabel: "Higher Secondary Level",
    questions: "100",
    duration: "60 min",
    mode: "Objective",
  },
  {
    exam: "SSC Selection Post",
    stage: "Graduate Level",
    mockTestLabel: "Graduate Level",
    questions: "100",
    duration: "60 min",
    mode: "Objective",
  },
];

export const examPresetOptions = examStageCatalog.map((item) => `${item.exam} - ${item.stage}`);
