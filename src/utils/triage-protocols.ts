export type Urgency = "self_care" | "see_doctor_soon" | "seek_care_now";

export interface TriageResult {
  id: string;
  urgency: Urgency;
  title: string;
  advice: string;
}

export interface TriageOption {
  label: string;
  nextStepId?: string;
  resultId?: string;
}

export interface TriageStep {
  id: string;
  question: string;
  options: TriageOption[];
}

export interface TriageProtocol {
  id: "headache" | "fever" | "chest_pain";
  name: string;
  icon: string;
  firstStepId: string;
  steps: TriageStep[];
  results: TriageResult[];
}

export const TRIAGE_PROTOCOLS: TriageProtocol[] = [
  {
    id: "headache",
    name: "Headache",
    icon: "flash-outline",
    firstStepId: "h1",
    steps: [
      {
        id: "h1",
        question: "Did the headache start suddenly and extremely severely, or is it the worst headache of your life?",
        options: [
          { label: "Yes", resultId: "h_care_now" },
          { label: "No", nextStepId: "h2" },
        ],
      },
      {
        id: "h2",
        question: "Do you have weakness, confusion, vision loss, or trouble speaking along with the headache?",
        options: [
          { label: "Yes", resultId: "h_care_now" },
          { label: "No", nextStepId: "h3" },
        ],
      },
      {
        id: "h3",
        question: "Do you have a fever with a stiff neck?",
        options: [
          { label: "Yes", resultId: "h_care_now" },
          { label: "No", nextStepId: "h4" },
        ],
      },
      {
        id: "h4",
        question: "Has the headache lasted several days or been getting progressively worse?",
        options: [
          { label: "Yes", resultId: "h_doctor_soon" },
          { label: "No", resultId: "h_self_care" },
        ],
      },
    ],
    results: [
      {
        id: "h_self_care",
        urgency: "self_care",
        title: "Manage at home",
        advice:
          "Rest, keep hydrated, and consider a general over-the-counter pain reliever as directed on the label. Symptoms should ease within a day or two.",
      },
      {
        id: "h_doctor_soon",
        urgency: "see_doctor_soon",
        title: "See a doctor soon",
        advice:
          "Book an appointment with a doctor in the next few days so this can be checked properly.",
      },
      {
        id: "h_care_now",
        urgency: "seek_care_now",
        title: "Seek care now",
        advice:
          "A sudden severe headache, or headache with weakness, confusion, vision loss, or a stiff neck, needs urgent attention. Go to the nearest hospital now.",
      },
    ],
  },
  {
    id: "fever",
    name: "Fever",
    icon: "thermometer-outline",
    firstStepId: "f1",
    steps: [
      {
        id: "f1",
        question: "How high is your temperature?",
        options: [
          { label: "Under 38°C", nextStepId: "f2" },
          { label: "38–39.5°C", nextStepId: "f2" },
          { label: "Above 39.5°C", resultId: "f_care_now" },
        ],
      },
      {
        id: "f2",
        question: "Do you have a stiff neck, a rash, confusion, or trouble breathing?",
        options: [
          { label: "Yes", resultId: "f_care_now" },
          { label: "No", nextStepId: "f3" },
        ],
      },
      {
        id: "f3",
        question: "Has the fever lasted more than 3 days?",
        options: [
          { label: "Yes", resultId: "f_doctor_soon" },
          { label: "No", resultId: "f_self_care" },
        ],
      },
    ],
    results: [
      {
        id: "f_self_care",
        urgency: "self_care",
        title: "Manage at home",
        advice:
          "Rest, keep hydrated, and consider a general over-the-counter fever reducer as directed on the label. Monitor your temperature and symptoms over the next day or two.",
      },
      {
        id: "f_doctor_soon",
        urgency: "see_doctor_soon",
        title: "See a doctor soon",
        advice:
          "A fever lasting more than three days should be checked by a doctor in the next few days.",
      },
      {
        id: "f_care_now",
        urgency: "seek_care_now",
        title: "Seek care now",
        advice:
          "A very high fever, or fever with a stiff neck, rash, confusion, or trouble breathing, needs urgent attention. Go to the nearest hospital now.",
      },
    ],
  },
  {
    id: "chest_pain",
    name: "Chest Pain",
    icon: "heart-outline",
    firstStepId: "c1",
    steps: [
      {
        id: "c1",
        question: "Is the pain spreading to your arm, jaw, neck, or back?",
        options: [
          { label: "Yes", resultId: "c_care_now" },
          { label: "No", nextStepId: "c2" },
        ],
      },
      {
        id: "c2",
        question: "Are you short of breath, sweating, or feeling sick to your stomach?",
        options: [
          { label: "Yes", resultId: "c_care_now" },
          { label: "No", nextStepId: "c3" },
        ],
      },
      {
        id: "c3",
        question: "Has the pain lasted more than a few minutes, or does it come with dizziness or lightheadedness?",
        options: [
          { label: "Yes", resultId: "c_care_now" },
          { label: "No", nextStepId: "c4" },
        ],
      },
      {
        id: "c4",
        question: "Is the pain brought on by exertion and relieved by rest?",
        options: [
          { label: "Yes", resultId: "c_doctor_soon" },
          { label: "No", resultId: "c_doctor_soon" },
        ],
      },
    ],
    results: [
      {
        id: "c_doctor_soon",
        urgency: "see_doctor_soon",
        title: "See a doctor soon",
        advice:
          "Any chest discomfort should be taken seriously. Book an appointment with a doctor in the next few days so it can be checked properly.",
      },
      {
        id: "c_care_now",
        urgency: "seek_care_now",
        title: "Seek care now",
        advice:
          "Chest pain that spreads, comes with shortness of breath or sweating, or lasts more than a few minutes needs urgent attention. Go to the nearest hospital now.",
      },
    ],
  },
];

export const getProtocol = (id: string) => TRIAGE_PROTOCOLS.find((p) => p.id === id);