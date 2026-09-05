# opencode task — Prompt 6: Protocol-based Symptom Triage

You are building **one self-contained feature** in an existing Expo Router (v57) app.
Claude is building the shared foundation (patient interface, care store, Hospitals
screen) in parallel. **Stay inside the two files listed below** so the work doesn't
collide.

## ✅ Files you own (create these, and ONLY these)
1. `src/utils/triage-protocols.ts` — the three hardcoded decision trees.
2. `src/app/patient/triage.tsx` — the triage screen (default-exported React component).

## 🚫 Do NOT touch (Claude owns these — editing them will cause merge conflicts)
- `src/app/patient/_layout.tsx` — the triage route + its header title are **already
  registered** here. You do not need to register anything.
- `src/app/patient/home.tsx` — the **"Check Your Symptoms" entry card already exists**
  and already calls `router.push("/patient/triage")`. Do not add it.
- `src/app/patient/hospitals.tsx` — exists. Your result screen just navigates to it.
- `src/context/care.tsx`, `src/utils/types.ts`, `src/app/_layout.tsx` — off limits.
- Do **not** add any npm dependency. Everything you need is already installed.

## Hard rules
- **Rule-based & deterministic only. Do NOT call any LLM / Claude / network API.**
  This is a guided questionnaire, not a chat.
- Err toward caution: false positives (sending someone to care unnecessarily) are fine;
  false negatives are not. For **Chest Pain**, any answer indicating pain radiating to
  the arm/jaw, shortness of breath, sweating, or pain lasting more than a few minutes
  must route straight to `seek_care_now`.

---

## 1. `src/utils/triage-protocols.ts`

Export three protocols (Headache, Fever, Chest Pain). Each is a short decision tree
(2–4 sequential questions) ending in one of three result ids. Use this shape — it keeps
the screen generic:

```ts
export type Urgency = "self_care" | "see_doctor_soon" | "seek_care_now";

export interface TriageResult {
  id: string;
  urgency: Urgency;
  title: string;      // e.g. "Manage at home"
  advice: string;     // 1–2 sentences. Keep OTC guidance GENERAL — never a specific dose.
}

export interface TriageOption {
  label: string;
  // exactly one of the two:
  nextStepId?: string;
  resultId?: string;
}

export interface TriageStep {
  id: string;
  question: string;
  options: TriageOption[];   // render as large tappable buttons, NOT a text input
}

export interface TriageProtocol {
  id: "headache" | "fever" | "chest_pain";
  name: string;              // "Headache"
  icon: string;              // Ionicons glyph name, e.g. "flash-outline"
  firstStepId: string;
  steps: TriageStep[];
  results: TriageResult[];
}

export const TRIAGE_PROTOCOLS: TriageProtocol[] = [ /* headache, fever, chest_pain */ ];

// helpers the screen will use:
export const getProtocol = (id: string) => TRIAGE_PROTOCOLS.find(p => p.id === id);
```

Advice wording examples (general, non-prescriptive):
- self_care: "Rest, keep hydrated, and consider a general over-the-counter pain reliever
  as directed on the label. Symptoms should ease within a day or two."
- see_doctor_soon: "Book an appointment with a doctor in the next few days so this can be
  checked properly."
- seek_care_now: "These symptoms need urgent attention. Go to the nearest hospital now."

Suggested trees (adjust freely, keep them cautious):
- **Chest Pain**: Q1 "Is the pain spreading to your arm, jaw, neck or back?" →
  yes = seek_care_now. Q2 "Are you short of breath or sweating?" → yes = seek_care_now.
  Q3 "Has it lasted more than a few minutes / does it come with dizziness?" →
  yes = seek_care_now, no = see_doctor_soon.
- **Fever**: Q1 "How high is your temperature?" (Under 38°C / 38–39.5°C / Above 39.5°C) —
  above 39.5 = seek_care_now. Q2 "Stiff neck, rash, confusion, or trouble breathing?" →
  yes = seek_care_now. Q3 "Has the fever lasted more than 3 days?" → yes = see_doctor_soon,
  no = self_care.
- **Headache**: Q1 "Sudden 'worst ever' / thunderclap headache, or with weakness,
  confusion or vision loss?" → yes = seek_care_now. Q2 "Fever with a stiff neck?" →
  yes = seek_care_now. Q3 "Been going on several days or getting worse?" →
  yes = see_doctor_soon, no = self_care.

---

## 2. `src/app/patient/triage.tsx`

**Screen flow (single default-exported component, local `useState` only):**
1. **Landing**: heading "What's bothering you?" + 3 selectable cards (Headache, Fever,
   Chest Pain) each with its Ionicons icon. Selecting one starts that protocol.
2. **Question view**: one question per screen; progress dots at the top; answer options
   as large tappable buttons. Selecting an option either advances to `nextStepId` or
   jumps to the result. Provide an in-screen **Back** button that pops to the previous
   question (or back to the landing on Q1). Keep a small step stack in state.
3. **Result view**: big colored urgency badge + the advice text. Colors MUST match the
   hospital status palette for consistency:
   - `self_care`  → `colors.success` (green)
   - `see_doctor_soon` → `colors.warning` (amber)
   - `seek_care_now` → `colors.critical` (red)
   When urgency is `seek_care_now`, show a prominent primary button
   **"Find Nearest Hospital"** that calls `router.push("/patient/hospitals")`.
   Also show a "Start over" button that resets to the landing.

**Persistent disclaimer** at the bottom of *every* triage view (landing, question,
result) — small gray text, not a scary box:
> "This is general guidance, not a medical diagnosis. When in doubt, seek care."

### Conventions to match (important — the app has a house style)
- The patient `_layout` renders a **native Stack header** for this screen (title
  "Check Your Symptoms", themed, with a working back arrow). So **do not** wrap the
  screen in a top SafeAreaView edge or draw your own top header — render content in a
  `ScrollView`. Use `SafeAreaView edges={["bottom"]}` (from `react-native-safe-area-context`)
  or just a `View`.
- Theme + tokens:
  ```ts
  import { useTheme } from "@/hooks/use-theme";
  import { Spacing, Radii } from "@/constants/theme";
  const { colors } = useTheme();
  ```
  Never hardcode hex for text/surfaces — use `colors.text`, `colors.textSecondary`,
  `colors.textMuted`, `colors.card`, `colors.cardElevated`, `colors.border`,
  `colors.primary`, `colors.success`, `colors.warning`, `colors.critical`.
- Reuse shared UI where natural: `import { Card, GradientButton, Badge } from "@/components/ui";`
  - `GradientButton` props: `label`, `icon?` (Ionicons name), `variant?: "primary" | "secondary" | "ghost"`, `onPress`, `fullWidth?`.
  - `Card` props: `variant?: "default" | "elevated" | "glass"`, `style`, `children`.
- Icons: `import { Ionicons } from "@expo/vector-icons";`
- ScrollView content style: `{ padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three }`.
- `router` from `import { useRouter } from "expo-router";` → `const router = useRouter();`.

### Skeleton to start from
```tsx
import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii } from "@/constants/theme";
import { Card, GradientButton, Badge } from "@/components/ui";
import { TRIAGE_PROTOCOLS, getProtocol, type Urgency } from "@/utils/triage-protocols";

const URGENCY_COLOR: Record<Urgency, "success" | "warning" | "critical"> = {
  self_care: "success",
  see_doctor_soon: "warning",
  seek_care_now: "critical",
};

export default function TriageScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [stepStack, setStepStack] = useState<string[]>([]);   // step ids visited
  const [resultId, setResultId] = useState<string | null>(null);
  // ...landing / question / result rendering...
  // Disclaimer <Text> pinned at the bottom of every view.
}
```

## Definition of done
- Selecting each of the 3 conditions runs its full question flow to a result.
- Chest-pain red-flag answers reach `seek_care_now` and its **Find Nearest Hospital**
  button navigates to `/patient/hospitals`.
- Back button works from any question; "Start over" resets from the result.
- Disclaimer visible on every view. No LLM/network calls. `npx tsc --noEmit` is clean.
