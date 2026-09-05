import { Platform } from "react-native";
import { makeId } from "@/utils/id";
import type { Prescription, ReminderLog } from "@/utils/types";

/**
 * Device medication reminders.
 *
 * When a prescription is saved, live (not demo) behaviour happens on-device:
 *  1. A repeating daily local notification per dose time (expo-notifications).
 *  2. A repeating daily event on the device calendar with an alarm
 *     (expo-calendar) — written only when a dev build supports it.
 *
 * Every action degrades gracefully and returns a ReminderLog so the demo UI
 * always shows what was (or wasn't) scheduled without waiting for a real alarm.
 *
 * expo modules are imported lazily so importing this file is safe on web and
 * in jest, where no native calendar/build exists.
 */

const DOSE_MS = 15 * 60 * 1000;

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map((n) => Number.parseInt(n, 10));
  return { hour: Number.isFinite(h) ? h : 9, minute: Number.isFinite(m) ? m : 0 };
}

export async function configureNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("med-reminders", {
        name: "Medication reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  } catch {
    // Notifications unavailable (e.g. tests) — reminders still log.
  }
}

/**
 * Schedule a repeating daily local notification for one dose time.
 * Returns the scheduled notification identifier, or null when denied/unavailable.
 */
async function scheduleDoseNotification(rx: Prescription, time: string): Promise<string | null> {
  const { hour, minute } = parseTime(time);
  try {
    const Notifications = await import("expo-notifications");
    const { status: current } = await Notifications.getPermissionsAsync();
    if (current !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== "granted") return null;
    }
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for your ${rx.drug}`,
        body: rx.instructions
          ? `Take ${rx.dosage} — ${rx.instructions}`
          : `Take ${rx.dosage} (${rx.frequency})`,
        data: { prescriptionId: rx.id, page: "/patient/home" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        ...(Platform.OS === "android" ? { channelId: "med-reminders" } : {}),
      },
    });
    return id;
  } catch {
    return null;
  }
}

async function createCalendarEvent(rx: Prescription, time: string): Promise<boolean> {
  try {
    const Calendar = await import("expo-calendar");
    if (Platform.OS === "web" || !(await Calendar.isAvailableAsync())) return false;

    const { status } = await Calendar.requestCalendarPermissions();
    if (status !== "granted") return false;

    const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
    const calendar =
      calendars.find((c) => c.allowsModifications && c.title !== "MedNexus") ??
      calendars.find((c) => c.allowsModifications) ??
      calendars[0];
    if (!calendar) return false;

    const { hour, minute } = parseTime(time);
    const start = new Date();
    start.setHours(hour, minute, 0, 0);
    if (start.getTime() <= Date.now()) start.setDate(start.getDate() + 1);
    const end = new Date(start.getTime() + DOSE_MS);

    await calendar.createEvent({
      title: `${rx.drug} ${rx.dosage}`,
      startDate: start,
      endDate: end,
      notes: `MedNexus dose reminder. ${rx.instructions ?? ""}`.trim(),
      alarms: [{ relativeOffset: 0 }],
      recurrenceRule: { frequency: Calendar.Frequency.DAILY },
    });
    return true;
  } catch {
    return false; // Expo Go or no writable calendar — doesn't block prescribing.
  }
}

export interface ReminderOutcome {
  /** One log entry per scheduled occurrence channel. */
  logs: ReminderLog[];
  /** True when every requested dose got a live notification. */
  notificationsScheduled: boolean;
  /** True when every requested dose has a device-calendar event. */
  calendarEventsCreated: boolean;
}

/**
 * Schedule live reminders for a freshly-saved prescription and return demo
 * logs describing what happened. Never throws.
 */
export async function scheduleMedicationReminders(rx: Prescription): Promise<ReminderOutcome> {
  const logs: ReminderLog[] = [];
  const now = new Date().toISOString();

  const notificationIds: (string | null)[] = [];
  for (const time of rx.doseTimes) {
    notificationIds.push(await scheduleDoseNotification(rx, time));
  }
  const scheduledCount = notificationIds.filter((id) => id !== null).length;
  if (scheduledCount > 0) {
    logs.push({
      id: makeId("rl"),
      patientId: rx.patientId,
      prescriptionId: rx.id,
      title: `${rx.drug} ${rx.dosage}`,
      detail: `Daily local notification scheduled for ${rx.doseTimes.join(" and ")}.`,
      channel: "Notification",
      scheduledAt: now,
    });
  }

  const calResults: boolean[] = [];
  for (const time of rx.doseTimes) {
    calResults.push(await createCalendarEvent(rx, time));
  }
  const calendarCount = calResults.filter(Boolean).length;
  if (calendarCount > 0) {
    logs.push({
      id: makeId("rl"),
      patientId: rx.patientId,
      prescriptionId: rx.id,
      title: `${rx.drug} ${rx.dosage}`,
      detail: `Daily event added to your device calendar for ${rx.doseTimes.join(" and ")}.`,
      channel: "Calendar",
      scheduledAt: now,
    });
  }

  return {
    logs,
    notificationsScheduled: scheduledCount === rx.doseTimes.length && rx.doseTimes.length > 0,
    calendarEventsCreated: calendarCount === rx.doseTimes.length && rx.doseTimes.length > 0,
  };
}