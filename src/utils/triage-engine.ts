import { getProtocol, type ProtocolId, type TriageOption, type Urgency } from "@/utils/triage-protocols";

/**
 * Portable patient facts the AI chat uses to personalise questions and
 * results. Mirrors the staff knowledge-network profile but patient-facing.
 */
export interface TriageProfile {
  age: number;
  gender?: string;
  conditions?: string[];
  allergies?: string[];
  medications?: string[];
}

/**
 * Structured outcome of Claude's free-text triage interpretation.
 * `protocol` is the best-guess protocol, `urgent` bypasses questions straight
 * to emergency advice, and `reasoning` is a short human note the AI surface.
 */
export interface ClaudeTriageHints {
  protocol: ProtocolId | null;
  urgent: boolean;
  reasoning: string;
}

const normalize = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9+\s]/g, " ").replace(/\s+/g, " ").trim();

const containsAny = (text: string, phrases: string[]) =>
  phrases.some((p) => text.includes(p));

/**
 * Keyword → canonical symptom tags, aligned with the knowledge-network
 * catalog used by src/utils/cases.ts. These preserve the staff "memory"
 * matching behaviour in the patient triage flow.
 */
const SYMPTOM_ALIASES: Record<string, string[]> = {
  headache: ["headache", "migraine", "head pain", "head hurts", "headache behind"],
  fever: ["fever", "temperature", "chills", "sweating", "hot", "feverish"],
  chest: ["chest pain", "chest", "heart pain", "angina", "tight chest", "chest tightness", "pressure on chest"],
  breathing: ["short of breath", "breathless", "difficulty breathing", "trouble breathing", "can't breathe", "trouble breath"],
  cough: ["cough", "coughing"],
  abdomen: ["abdominal", "stomach", "belly", "tummy"],
  fatigue: ["tired", "fatigue", "exhausted", "weak"],
  dizziness: ["dizzy", "lightheaded", "light-headed", "faint", "dizziness"],
  nausea: ["nausea", "nauseous", "sick to my stomach", "throwing up", "vomit"],
  confusion: ["confusion", "confused", "not thinking clearly"],
  neckstiff: ["stiff neck", "neck is stiff", "stiffness"],
  rash: ["rash", "spots", "skin rash"],
};

const PROTOCOL_ROUTING: Record<ProtocolId, { key: string; weight: number }[]> = {
  headache: [
    { key: "headache", weight: 4 },
    { key: "dizziness", weight: 1 },
    { key: "confusion", weight: 1 },
  ],
  fever: [
    { key: "fever", weight: 4 },
    { key: "cough", weight: 1 },
    { key: "neckstiff", weight: 2 },
    { key: "rash", weight: 2 },
  ],
  chest_pain: [
    { key: "chest", weight: 5 },
    { key: "breathing", weight: 2 },
    { key: "nausea", weight: 1 },
    { key: "dizziness", weight: 1 },
  ],
};

/**
 * Extract canonical symptom tags (for the knowledge network) from a free-text
 * symptom description. Only known aliases are returned; unknown text is
 * ignored rather than guessed.
 */
export function extractSymptoms(text: string): string[] {
  const t = normalize(text);
  if (!t) return [];
  return Object.entries(SYMPTOM_ALIASES)
    .filter(([, aliases]) => containsAny(t, aliases))
    .map(([tag]) => tag);
}

/**
 * Pick the best-matching triage protocol for a free-text symptom description.
 * Scores each protocol by weighted keyword hits and returns the winner, or
 * null when nothing is recognisable.
 */
export function routeProtocol(text: string): ProtocolId | null {
  const t = normalize(text);
  if (!t) return null;
  const symptoms = extractSymptoms(t);
  if (symptoms.length === 0) return null;

  const scores = new Map<ProtocolId, number>();
  (["headache", "fever", "chest_pain"] as ProtocolId[]).forEach((id) => {
    const total = PROTOCOL_ROUTING[id].reduce((sum, { key, weight }) => {
      const aliases = SYMPTOM_ALIASES[key];
      return sum + (containsAny(t, aliases) ? weight : 0);
    }, 0);
    if (total > 0) scores.set(id, total);
  });

  if (scores.size === 0) return null;
  return [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** Red-flag symptom phrases per protocol that must bypass questions. */
const RED_FLAGS: Record<ProtocolId, string[][]> = {
  headache: [
    ["worst headache", "sudden severe headache", "worst of my life"],
    ["weakness", "confusion", "vision loss", "trouble speaking", "face droop"],
    ["stiff neck", "fever", "neck is stiff"],
  ],
  fever: [
    ["above 39", "over 39", "very high"],
    ["stiff neck", "rash", "confusion", "trouble breathing", "trouble breath"],
  ],
  chest_pain: [
    ["arm", "jaw", "neck", "back", "radiating", "spreading to"],
    ["short of breath", "sweating", "nausea", "sick to my stomach"],
    ["dizzy", "lightheaded", "more than a few minutes", "passed out"],
  ],
};

/**
 * True when the free text already mentions a red-flag pattern that should
 * escalate straight to emergency care without further questioning.
 */
export function isUrgentText(text: string, protocol: ProtocolId): boolean {
  const t = normalize(text);
  if (!t) return false;
  return RED_FLAGS[protocol].some((group) => {
    const matches = group.filter((p) => t.includes(p));
    return matches.length >= (group.length > 1 ? 1 : 1);
  });
}

const NO_WORDS = ["no", "nope", "nah", "not really", "not", "never", "false", "incorrect", "i don't think so", "i don't"];

/** Rough sentiment: 1 = affirmative, -1 = negative, 0 = unclear (numbers aside). */
function sentiment(text: string): 1 | -1 | 0 {
  const t = normalize(text);
  if (t.length < 2) return 0;
  if (t.startsWith("yeah") || t.startsWith("yep") || t.startsWith("yup")) return 1;
  if (t.startsWith("nah") || t.startsWith("nope")) return -1;
  if (NO_WORDS.some((w) => t.startsWith(w) || t === w)) return -1;
  if (t.startsWith("yes")) return 1;
  // "is it in my arm" is a question, not an answer — treat as unclear.
  if (t.endsWith("?") && t.startsWith("w")) return 0;
  return 0;
}

/** Parse a temperature (Celcius) directly out of free text, if present. */
function parseTemperature(text: string): number | null {
  const m = text.match(/(\d{2}(?:\.\d)?)\s*(?:°\s*c|celsius|degrees?)?/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  return value >= 36 && value <= 42 ? value : null;
}

/** Extract the numeric bounds of an option label like "38–39.5°C". */
function optionTempBounds(label: string): { min: number | null; max: number | null } {
  const l = label.toLowerCase();
  const numbers = [...l.matchAll(/(\d{2}(?:\.\d)?)/g)].map((m) => parseFloat(m[1]));
  if (numbers.length === 0) return { min: null, max: null };
  if (/(under|below|less than)/.test(l)) return { min: null, max: numbers[0] };
  if (/(above|over|more than|greater than)/.test(l)) return { min: numbers[0], max: null };
  return { min: numbers[0], max: numbers[1] ?? numbers[0] };
}

/**
 * Match a user's free-text answer to one of a step's options.
 * Handles Yes/No answers, temperatures (fever protocol) and generic keyword
 * hits. Returns the option index, or null when the answer is ambiguous and we
 * should re-ask with the explicit choices.
 */
export function matchAnswerOption(text: string, options: TriageOption[]): number | null {
  const t = normalize(text);

  // Temperature-based options (fever protocol).
  const temp = parseTemperature(text);
  if (temp !== null && options.some((o) => /°|temp|celsius/i.test(o.label))) {
    for (let i = 0; i < options.length; i++) {
      const { min, max } = optionTempBounds(options[i].label);
      if (min === null && max === null) continue;
      if (min !== null && temp < min) continue;
      if (max !== null && temp > max) continue;
      return i;
    }
  }

  // Yes / No options — the overwhelming majority of protocol steps.
  const yesIdx = options.findIndex((o) => normalize(o.label) === "yes");
  const noIdx = options.findIndex((o) => normalize(o.label) === "no");
  if (yesIdx >= 0 || noIdx >= 0) {
    const sent = sentiment(t);
    if (sent === 1 && yesIdx >= 0) return yesIdx;
    if (sent === -1 && noIdx >= 0) return noIdx;
    // Generic keyword hit on one of the options.
    for (let i = 0; i < options.length; i++) {
      const label = normalize(options[i].label);
      if (label !== "yes" && label !== "no" && t.includes(label)) return i;
    }
    return null;
  }

  // Keyword matches on descriptive options.
  for (let i = 0; i < options.length; i++) {
    const label = normalize(options[i].label);
    const keywords = label.split(/\s+/).filter((w) => w.length > 3);
    if (keywords.length > 0 && keywords.some((k) => t.includes(k))) return i;
  }
  return null;
}

/** Get the protocol id for a label like "Headache" → "headache". */
export function protocolIdForLabel(label: string): ProtocolId | null {
  const l = normalize(label);
  if (l === "headache" || l.includes("headache")) return "headache";
  if (l === "fever" || l.includes("fever")) return "fever";
  if (l === "chest pain" || l.includes("chest") || l.includes("heart")) return "chest_pain";
  return null;
}

/** Convenience: urgency string mapping for the AI summary. */
export const URGENCY_LABEL: Record<Urgency, string> = {
  self_care: "manage at home",
  see_doctor_soon: "see a doctor soon",
  seek_care_now: "seek care immediately",
};

export { getProtocol };