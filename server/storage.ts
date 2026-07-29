import { db } from "./db";
import {
  users, attendance, settings, attendancePeriods,
  type User, type InsertUser,
  type Attendance, type InsertAttendance,
  type Settings, type InsertSettings,
  type AttendancePeriod, type InsertAttendancePeriod,
} from "@shared/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getStudents(): Promise<User[]>;

  // Attendance
  markAttendance(data: InsertAttendance): Promise<Attendance>;
  getAttendanceHistory(userId?: string): Promise<Attendance[]>;
  deleteAttendance(id: number): Promise<void>;
  getPendingAttendance(): Promise<Attendance[]>;
  approveAttendance(id: number): Promise<Attendance>;
  rejectAttendance(id: number): Promise<Attendance>;
  hasMarkedAttendanceForPeriod(userId: string, periodId: number | null, date: Date): Promise<boolean>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(data: InsertSettings): Promise<Settings>;

  // Attendance Periods
  getPeriods(): Promise<AttendancePeriod[]>;
  getPeriodById(id: number): Promise<AttendancePeriod | undefined>;
  createPeriod(data: Omit<InsertAttendancePeriod, 'emailSent'>): Promise<AttendancePeriod>;
  updatePeriod(id: number, data: Partial<InsertAttendancePeriod>): Promise<AttendancePeriod>;
  deletePeriod(id: number): Promise<void>;
  markEmailSentForPeriod(id: number): Promise<void>;
  resetEmailSentFlags(): Promise<void>;
  getActivePeriodNow(): Promise<AttendancePeriod | null>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user as any).returning();
    return newUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(attendance).where(eq(attendance.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async getStudents(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'student'));
  }

  async markAttendance(data: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(data).returning();
    return record;
  }

  async getAttendanceHistory(userId?: string): Promise<Attendance[]> {
    if (userId) {
      return await db.select().from(attendance).where(eq(attendance.userId, userId)).orderBy(desc(attendance.date));
    }
    return await db.select().from(attendance).orderBy(desc(attendance.date));
  }

  async deleteAttendance(id: number): Promise<void> {
    await db.delete(attendance).where(eq(attendance.id, id));
  }

  async getPendingAttendance(): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.approvalStatus, 'PENDING')).orderBy(desc(attendance.date));
  }

  async approveAttendance(id: number): Promise<Attendance> {
    const [record] = await db.update(attendance).set({ approvalStatus: 'APPROVED' }).where(eq(attendance.id, id)).returning();
    return record;
  }

  async rejectAttendance(id: number): Promise<Attendance> {
    const [record] = await db.update(attendance).set({ approvalStatus: 'REJECTED' }).where(eq(attendance.id, id)).returning();
    return record;
  }
  /** Check if student already marked attendance for the same period today */
  async hasMarkedAttendanceForPeriod(userId: string, periodId: number | null, date: Date): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await db.select().from(attendance).where(
      and(
        eq(attendance.userId, userId),
        periodId === null ? isNull(attendance.periodId) : eq(attendance.periodId, periodId)
      )
    );
    // Filter by today in JS (avoids complex SQL date range)
    return records.some(r => {
      const d = new Date(r.date);
      return d >= startOfDay && d <= endOfDay;
    });
  }

  async getSettings(): Promise<Settings> {
    let [setting] = await db.select().from(settings);
    if (!setting) {
      // Default settings
      [setting] = await db.insert(settings).values({
        allowedLatitude: 0,
        allowedLongitude: 0,
        allowedRadius: 200,
      }).returning();
    }
    return setting;
  }

  async updateSettings(data: InsertSettings): Promise<Settings> {
    let [setting] = await db.select().from(settings);
    if (!setting) {
      [setting] = await db.insert(settings).values(data).returning();
      return setting;
    }
    [setting] = await db.update(settings).set(data).where(eq(settings.id, setting.id)).returning();
    return setting;
  }

  // ── Attendance Period Methods ────────────────────────────────────────────────

  async getPeriods(): Promise<AttendancePeriod[]> {
    return await db.select().from(attendancePeriods).orderBy(attendancePeriods.periodNumber);
  }

  async getPeriodById(id: number): Promise<AttendancePeriod | undefined> {
    const [period] = await db.select().from(attendancePeriods).where(eq(attendancePeriods.id, id));
    return period;
  }

  async createPeriod(data: Omit<InsertAttendancePeriod, 'emailSent'>): Promise<AttendancePeriod> {
    const [period] = await db.insert(attendancePeriods).values({
      ...data,
      emailSent: "false",
    } as any).returning();
    return period;
  }

  async updatePeriod(id: number, data: Partial<InsertAttendancePeriod>): Promise<AttendancePeriod> {
    const [period] = await db.update(attendancePeriods).set(data as any).where(eq(attendancePeriods.id, id)).returning();
    return period;
  }

  async deletePeriod(id: number): Promise<void> {
    await db.delete(attendancePeriods).where(eq(attendancePeriods.id, id));
  }

  async markEmailSentForPeriod(id: number): Promise<void> {
    await db.update(attendancePeriods).set({ emailSent: "true" }).where(eq(attendancePeriods.id, id));
  }

  /** Reset `emailSent` to false daily so reminders fire each new day */
  async resetEmailSentFlags(): Promise<void> {
    await db.update(attendancePeriods).set({ emailSent: "false" });
  }

  /**
   * Return the period whose time window contains the current time.
   * Returns null if no period is currently active.
   */
  async getActivePeriodNow(): Promise<AttendancePeriod | null> {
    const rawNow = new Date();
    // Convert to Asia/Kolkata (IST) to match the user's local timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = formatter.formatToParts(rawNow);
    const hour = parts.find((p) => p.type === "hour")?.value;
    const min = parts.find((p) => p.type === "minute")?.value;
    const hhmm = `${hour}:${min}`;

    // For midnight (24:xx), Intl.DateTimeFormat can return '24'; map it to '00'
    const finalHhmm = hhmm.replace(/^24:/, "00:");

    const periods = await this.getPeriods();
    for (const p of periods) {
      if (p.isActive === "false") continue;
      if (finalHhmm >= p.startTime && finalHhmm <= p.endTime) {
        return p;
      }
    }
    return null;
  }
}

export const storage = new DatabaseStorage();