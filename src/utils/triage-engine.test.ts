/**
 * @jest-environment node
 */

import {
  extractSymptoms,
  routeProtocol,
  isUrgentText,
  matchAnswerOption,
  protocolIdForLabel,
} from "@/utils/triage-engine";
import { getProtocol } from "@/utils/triage-protocols";

describe("triage-engine routing", () => {
  it("routes a headache description to the headache protocol", () => {
    expect(routeProtocol("I have a really bad headache behind my eyes")).toBe("headache");
  });

  it("routes a fever description to the fever protocol", () => {
    expect(routeProtocol("I feel feverish and have chills")).toBe("fever");
  });

  it("routes chest tightness to the chest pain protocol", () => {
    expect(routeProtocol("There is pressure on my chest")).toBe("chest_pain");
  });

  it("returns null for unrecognisable text", () => {
    expect(routeProtocol("the sky is blue today with birds")).toBeNull();
  });

  it("extracts only known canonical symptoms", () => {
    expect(extractSymptoms("I have a headache and a bad cough")).toEqual(
      expect.arrayContaining(["headache", "cough"])
    );
    expect(extractSymptoms("my dog is barking")).toEqual([]);
  });
});

describe("triage-engine red flags", () => {
  it("flags the worst headache", () => {
    expect(isUrgentText("worst headache of my life", "headache")).toBe(true);
  });

  it("flags chest pain spreading to the arm", () => {
    expect(isUrgentText("pain going down my left arm", "chest_pain")).toBe(true);
  });

  it("flags very high fever", () => {
    expect(isUrgentText("temperature above 39 degrees", "fever")).toBe(true);
  });

  it("does not over-escalate benign reports", () => {
    expect(isUrgentText("a mild headache this morning", "headache")).toBe(false);
  });
});

describe("triage-engine answer matching", () => {
  const headache = getProtocol("headache")!;
  const fever = getProtocol("fever")!;

  it("maps yes/no answers onto Yes/No options", () => {
    const step = headache.steps[0];
    expect(matchAnswerOption("yes", step.options)).toBe(0);
    expect(matchAnswerOption("no", step.options)).toBe(1);
    expect(matchAnswerOption("nope", step.options)).toBe(1);
  });

  it("maps a numeric temperature onto the fever options", () => {
    const step = fever.steps[0];
    const highIdx = step.options.findIndex((o) => o.label.startsWith("Above"));
    expect(matchAnswerOption("it is 39.8 I think", step.options)).toBe(highIdx);
  });

  it("rejects ambiguous answers so the AI re-asks", () => {
    const step = headache.steps[0];
    expect(matchAnswerOption("maybe, hard to say", step.options)).toBeNull();
  });

  it("keeps empty input un-routed", () => {
    expect(matchAnswerOption("", headache.steps[0].options)).toBeNull();
    expect(routeProtocol("")).toBeNull();
  });
});

describe("triage-engine label lookup", () => {
  it("maps display labels back to protocol ids", () => {
    expect(protocolIdForLabel("Headache")).toBe("headache");
    expect(protocolIdForLabel("Chest Pain")).toBe("chest_pain");
    expect(protocolIdForLabel("Fever")).toBe("fever");
  });
});