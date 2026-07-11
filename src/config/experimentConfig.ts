import type { ExperimentCondition, LikertOption, StatementItem } from "../types/experiment";

export const experimentConfig = {
  studyTitle: "AI Statement Study",
  participantIdPrefix: "P",
  progressBarVisible: true,
  loadingDurationMs: {
    min: 1500,
    max: 3000,
  },
  ratingScale: {
    min: 0,
    max: 10,
    step: 1,
    defaultValue: 5,
    lowLabel: "Unsure",
    highLabel: "Sure",
  },
  admin: {
    password: import.meta.env.VITE_ADMIN_PASSWORD || "research-admin",
  },
  database: {
    provider: "supabase",
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
    participantTable: "participant_sessions",
    responseTable: "trial_responses",
  },
  consent: {
    title: "Privacy Notice",
    text:
      "You are invited to take part in a short research task about judgments of informational statements. Your responses will be stored with a randomly generated Participant ID. Please do not enter identifying information. Participation is voluntary, and you may stop at any time by closing this page.",
    agreeButton: "I agree",
  },
  instructions: [
    "You will review a series of informational statements presented by an AI assistant.",
    "For each statement, indicate how confident you are that the statement is true.",
    "Once you release the mouse or lift your finger after dragging the scale, your answer will be submitted automatically.",
    "Please answer based on your own judgment.",
    "There are no right or wrong answers.",
  ],
  demographics: {
    genderOptions: ["Woman", "Man", "Non-binary", "Prefer not to say", "Self-describe"],
    educationOptions: [
      "High school or equivalent",
      "Some college",
      "Associate degree",
      "Bachelor's degree",
      "Graduate degree",
      "Prefer not to say",
    ],
  },
};

export const conditions: ExperimentCondition[] = [
  {
    id: "umm",
    label: "Umm",
    loadingText: "umm",
  },
  {
    id: "hmm",
    label: "Hmm",
    loadingText: "hmm",
  },
  {
    id: "control",
    label: "Control",
    loadingText: "Thinking",
  },
];

export const likertScale: LikertOption[] = [
  { value: 0, label: "Not confident at all" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "Unsure" },
  { value: 6, label: "6" },
  { value: 7, label: "7" },
  { value: 8, label: "8" },
  { value: 9, label: "9" },
  { value: 10, label: "Completely confident" },
];

export const statements: StatementItem[] = [
  {
    id: "false-01",
    groundTruth: false,
    text:
      "The Pacific shimmer eel communicates by producing tiny flashes of ultraviolet light that only other shimmer eels can detect.",
  },
  {
    id: "false-02",
    groundTruth: false,
    text: "Scientists discovered a mineral called luminite that becomes temporarily weightless when cooled below -50 C.",
  },
  {
    id: "false-03",
    groundTruth: false,
    text:
      "There is a species of tree called the silver whisper pine whose leaves emit a faint humming sound before rainfall.",
  },
  {
    id: "false-04",
    groundTruth: false,
    text:
      'The country of Norvia celebrates an annual "Night of Echoes," during which all artificial lights are turned off by law for one hour.',
  },
  {
    id: "false-05",
    groundTruth: false,
    text: "A rare cloud type called a spiral veil cloud forms only above dormant volcanoes during full moons.",
  },
  {
    id: "true-06",
    groundTruth: true,
    text:
      "Venus takes longer to complete one full rotation on its axis than it takes to orbit the Sun, which means that a single day on Venus is actually longer than an entire Venusian year.",
  },
  {
    id: "true-07",
    groundTruth: true,
    text:
      "Although many people think the Great Wall of China can be seen from space with the naked eye, astronauts have confirmed that it is generally not visible without optical aid under normal viewing conditions because it is too narrow and blends into the surrounding landscape.",
  },
  {
    id: "true-08",
    groundTruth: true,
    text:
      "Honey is one of the few natural foods that can remain safe to eat for thousands of years when stored in a sealed container because its low moisture content and acidic properties prevent the growth of most microorganisms.",
  },
  {
    id: "true-09",
    groundTruth: true,
    text:
      "Sharks have existed on Earth for more than 400 million years, meaning they were already swimming in the oceans long before the first trees evolved on land.",
  },
  {
    id: "true-10",
    groundTruth: true,
    text:
      "The fingerprints of koalas are so similar to those of humans that they have reportedly been mistaken for human fingerprints under certain conditions, even when examined with standard forensic methods.",
  },
];
