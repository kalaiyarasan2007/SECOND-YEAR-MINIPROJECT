import { pgTable, text, varchar, serial, integer, doublePrecision, timestamp, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Using Register Number as ID
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'admin' | 'student'
  faceEncoding: json("face_encoding").$type<number[]>(),
});

// ── Timetable / Periods ────────────────────────────────────────────────────────
export const attendancePeriods = pgTable("attendance_periods", {
  id: serial("id").primaryKey(),
  periodNumber: integer("period_number").notNull(),
  label: text("label").notNull(),                       // e.g. "Period 1"
  startTime: text("start_time").notNull(),              // e.g. "09:00"
  endTime: text("end_time").notNull(),                  // e.g. "09:50"
  isActive: text("is_active").notNull().default("true"),
  emailSent: text("email_sent").notNull().default("false"), // Reset daily
});

// ── Attendance Records ─────────────────────────────────────────────────────────
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  periodId: integer("period_id").references(() => attendancePeriods.id),
  periodNumber: integer("period_number"),
  periodName: text("period_name"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  date: timestamp("date").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  distanceFromCenter: doublePrecision("distance_from_center").notNull(),
  status: text("status").notNull(),                                      // 'PRESENT' | 'ABSENT'
  approvalStatus: text("approval_status").notNull().default("PENDING"),  // 'PENDING' | 'APPROVED' | 'REJECTED'
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  allowedLatitude: doublePrecision("allowed_latitude").notNull(),
  allowedLongitude: doublePrecision("allowed_longitude").notNull(),
  allowedRadius: doublePrecision("allowed_radius").notNull(), // in meters
});

// ── Zod schemas ────────────────────────────────────────────────────────────────
export const insertUserSchema = createInsertSchema(users);
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertAttendancePeriodSchema = createInsertSchema(attendancePeriods).omit({ id: true });

// ── TypeScript types ───────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type AttendancePeriod = typeof attendancePeriods.$inferSelect;
export type InsertAttendancePeriod = z.infer<typeof insertAttendancePeriodSchema>;
