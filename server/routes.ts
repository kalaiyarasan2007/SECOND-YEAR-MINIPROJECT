import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { broadcast } from "./websocket";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.SESSION_SECRET || "default_secret_fallback";

// ── Email transporter (configure via .env) ─────────────────────────────────────
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

async function sendPeriodReminderEmails(period: {
  id: number; label: string; startTime: string; endTime: string; periodNumber: number;
}) {
  try {
    const students = await storage.getStudents();
    const emails = students.map((s) => s.email).filter(Boolean);
    if (!emails.length) return;

    const subject = `📅 ${period.label} Attendance Open Soon — Be Ready!`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f8fafc;padding:32px;border-radius:16px">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;border-radius:12px;text-align:center;color:#fff;margin-bottom:24px">
          <h1 style="margin:0;font-size:22px">🎓 GeoFace Smart Attendance</h1>
          <p style="margin:8px 0 0;opacity:.85">Period Attendance Reminder</p>
        </div>
        <h2 style="color:#1e293b">${period.label} is starting soon!</h2>
        <p style="color:#475569;font-size:16px">
          Attendance for <strong>${period.label}</strong> (Period ${period.periodNumber}) will be open very soon.<br/>
          <strong>Window:</strong> ${period.startTime} – ${period.endTime}
        </p>
        <p style="color:#ef4444;font-weight:600">⚠️ Please be at the correct location.</p>
        <a href="${process.env.APP_URL || 'http://localhost:5000'}"
           style="display:inline-block;margin-top:16px;padding:14px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:16px">
          Open Attendance System →
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          This is an automated reminder. Please do not reply to this email.
        </p>
      </div>`;

    await mailer.sendMail({
      from: `"GeoFace Attendance" <${process.env.SMTP_USER}>`,
      bcc: emails.join(","),
      subject,
      html,
    });

    console.log(`[Email] Sent 5-min period reminder for ${period.label} to ${emails.length} student(s)`);
  } catch (err: any) {
    console.error("[Email] Failed to send reminder:", err.message);
  }
}

function getFutureTimeFiveMinutesFromNow() {
  const date = new Date(new Date().getTime() + 5 * 60000);
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour12: false, hour: "2-digit", minute: "2-digit" });
  const parts = formatter.formatToParts(date);
  return `${parts.find(p => p.type === "hour")?.value}:${parts.find(p => p.type === "minute")?.value}`.replace(/^24:/, "00:");
}

function getCurrentTime() {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour12: false, hour: "2-digit", minute: "2-digit" });
  const parts = formatter.formatToParts(new Date());
  return `${parts.find(p => p.type === "hour")?.value}:${parts.find(p => p.type === "minute")?.value}`.replace(/^24:/, "00:");
}

// ── Period scheduler — runs every minute ────────────────────────────────────────
let lastResetDay = -1;

function startPeriodScheduler() {
  setInterval(async () => {
    try {
      const today = new Date().getDate();

      // Reset emailSent flags once per day (at midnight)
      if (today !== lastResetDay) {
        lastResetDay = today;
        await storage.resetEmailSentFlags();
        console.log("[Scheduler] Reset email-sent flags for new day");
      }

      const futureHhmm = getFutureTimeFiveMinutesFromNow();
      const currentHhmm = getCurrentTime();
      const periods = await storage.getPeriods();

      for (const period of periods) {
        if (period.isActive === "false") continue;

        // Start of period
        const isOpen = currentHhmm >= period.startTime && currentHhmm < period.endTime;
        if (isOpen && currentHhmm === period.startTime) {
          broadcast({ type: "period_started", data: period });
          console.log(`[Scheduler] Period ${period.label} started — attendance open`);
        }

        // Just ended
        if (currentHhmm === period.endTime) {
          broadcast({ type: "period_ended", data: period });
          console.log(`[Scheduler] Period ${period.label} ended — attendance closed`);
        }

        // 5 Minutes prior reminder
        if (futureHhmm === period.startTime && period.emailSent !== "true") {
          await storage.markEmailSentForPeriod(period.id);
          await sendPeriodReminderEmails(period);
          broadcast({ type: "period_reminder_sent", data: period });
        }
      }
    } catch (err: any) {
      console.error("[Scheduler] Error:", err.message);
    }
  }, 60_000); // every minute
}
// ─── Type augmentation ─────────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string };
    }
  }
}

// ─── Cookie config ─────────────────────────────────────────────────────────────
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

function roleCookieName(role: string) {
  return role === "admin" ? "admin_token" : "student_token";
}

// ─── Role-scoped authentication middleware ─────────────────────────────────────
function authenticateRole(role: "admin" | "student") {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[roleCookieName(role)];
    if (!token) {
      return res.status(401).json({ message: `Unauthorized: Not logged in as ${role}` });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      if (decoded.role !== role) {
        return res.status(403).json({ message: `Forbidden: Token is not for ${role}` });
      }
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

// ─── Utility: time overlap check ───────────────────────────────────────────────
function timesOverlap(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// ─── Utility functions ─────────────────────────────────────────────────────────
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function euclideanDistance(desc1: number[], desc2: number[]) {
  return Math.sqrt(desc1.reduce((sum, val, i) => sum + Math.pow(val - desc2[i], 2), 0));
}

// ─── Route registration ────────────────────────────────────────────────────────
export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // Simple cookie parser middleware
  app.use((req, _res, next) => {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      req.cookies = cookieHeader.split(";").reduce((acc: any, c) => {
        const [key, val] = c.trim().split("=").map(decodeURIComponent);
        try { acc[key] = JSON.parse(val); } catch { acc[key] = val; }
        return acc;
      }, {});
    }
    next();
  });

  // ── POST /api/auth/login ───────────────────────────────────────────────────
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = api.auth.login.input.parse(req.body);
      const requestedRole = (req.body.role as string | undefined) ?? null;

      const user = await storage.getUserByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (requestedRole && user.role !== requestedRole) {
        return res.status(403).json({
          message: `This account is not registered as a ${requestedRole}. Please use the correct login page.`,
        });
      }

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
      res.cookie(roleCookieName(user.role), token, COOKIE_OPTS);

      const { passwordHash, faceEncoding, ...safeUser } = user;
      return res.status(200).json({ user: safeUser });
    } catch (err) {
      console.error("[Login Error]", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── GET /api/auth/me ───────────────────────────────────────────────────────
  app.get(api.auth.me.path, async (req, res) => {
    async function resolveToken(cookieKey: string, expectedRole: string) {
      const token = req.cookies?.[cookieKey];
      if (!token) return null;
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        if (decoded.role !== expectedRole) return null;
        const u = await storage.getUser(decoded.userId);
        if (!u) return null;
        const { passwordHash, faceEncoding, ...safe } = u;
        return safe;
      } catch {
        return null;
      }
    }

    const [adminUser, studentUser] = await Promise.all([
      resolveToken("admin_token", "admin"),
      resolveToken("student_token", "student"),
    ]);

    return res.json({ admin: adminUser, student: studentUser });
  });

  // ── POST /api/auth/logout ──────────────────────────────────────────────────
  app.post("/api/auth/logout", (req, res) => {
    const role = req.body?.role as string | undefined;
    if (role === "admin") {
      res.clearCookie("admin_token");
    } else if (role === "student") {
      res.clearCookie("student_token");
    } else {
      res.clearCookie("admin_token");
      res.clearCookie("student_token");
      res.clearCookie("auth_token");
    }
    return res.json({ message: "Logged out", role: role ?? "all" });
  });

  // ── Admin routes ───────────────────────────────────────────────────────────
  const adminOnly = authenticateRole("admin");

  app.post(api.admin.students.create.path, adminOnly, async (req, res) => {
    try {
      const input = api.admin.students.create.input.parse(req.body);
      const existing = await storage.getUserByEmail(input.email);
      if (existing) return res.status(400).json({ message: "Email already exists" });

      const passwordHash = await bcrypt.hash(input.password, 10);
      const newStudent = await storage.createUser({
        id: input.id, name: input.name, email: input.email,
        passwordHash, role: "student", faceEncoding: input.faceEncoding,
      });
      const { passwordHash: _, faceEncoding: __, ...safe } = newStudent;
      return res.status(201).json(safe);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.admin.students.list.path, adminOnly, async (_req, res) => {
    const students = await storage.getStudents();
    return res.json(students.map(({ passwordHash, faceEncoding, ...safe }) => safe));
  });

  app.get(api.admin.settings.get.path, adminOnly, async (_req, res) => {
    return res.json(await storage.getSettings());
  });

  app.put(api.admin.settings.update.path, adminOnly, async (req, res) => {
    try {
      const input = api.admin.settings.update.input.parse(req.body);
      return res.json(await storage.updateSettings(input));
    } catch {
      return res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.admin.attendance.list.path, adminOnly, async (_req, res) => {
    return res.json(await storage.getAttendanceHistory());
  });

  app.get(api.admin.attendance.pending.path, adminOnly, async (_req, res) => {
    return res.json(await storage.getPendingAttendance());
  });

  app.put("/api/admin/attendance/:id/approve", adminOnly, async (req, res) => {
    try {
      const record = await storage.approveAttendance(Number(req.params.id));
      broadcast({ type: "attendance_approved", data: record });
      return res.json({ message: "Attendance approved successfully", record });
    } catch {
      return res.status(500).json({ message: "Failed to approve attendance" });
    }
  });

  app.put("/api/admin/attendance/:id/reject", adminOnly, async (req, res) => {
    try {
      const record = await storage.rejectAttendance(Number(req.params.id));
      broadcast({ type: "attendance_rejected", data: record });
      return res.json({ message: "Attendance rejected", record });
    } catch {
      return res.status(500).json({ message: "Failed to reject attendance" });
    }
  });

  app.delete(api.admin.attendance.delete.path, adminOnly, async (req, res) => {
    await storage.deleteAttendance(Number(req.params.id));
    return res.status(204).end();
  });

  app.delete(api.admin.students.delete.path, adminOnly, async (req, res) => {
    await storage.deleteUser(String(req.params.id));
    return res.status(204).end();
  });

  // ── Admin Period Management ────────────────────────────────────────────────

  app.get(api.admin.periods.list.path, adminOnly, async (_req, res) => {
    return res.json(await storage.getPeriods());
  });

  app.post(api.admin.periods.create.path, adminOnly, async (req, res) => {
    try {
      const input = api.admin.periods.create.input.parse(req.body);

      // Validate: endTime > startTime
      if (input.startTime >= input.endTime) {
        return res.status(400).json({ message: "End time must be after start time." });
      }

      // Validate: no overlap with existing active periods
      const existing = await storage.getPeriods();
      const conflict = existing.find((p) =>
        p.isActive !== "false" &&
        timesOverlap(input.startTime, input.endTime, p.startTime, p.endTime)
      );
      if (conflict) {
        return res.status(400).json({
          message: `Time conflict with existing ${conflict.label} (${conflict.startTime}–${conflict.endTime}).`,
        });
      }

      const period = await storage.createPeriod({
        periodNumber: input.periodNumber,
        label: input.label,
        startTime: input.startTime,
        endTime: input.endTime,
        isActive: input.isActive ?? "true",
      });
      broadcast({ type: "period_created", data: period });
      return res.status(201).json(period);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.admin.periods.update.path, adminOnly, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.admin.periods.update.input.parse(req.body);

      const existing = await storage.getPeriods();
      const current = existing.find(p => p.id === id);
      if (!current) return res.status(404).json({ message: "Period not found" });

      const mergedStart = input.startTime ?? current.startTime;
      const mergedEnd = input.endTime ?? current.endTime;

      if (mergedStart >= mergedEnd) {
        return res.status(400).json({ message: "End time must be after start time." });
      }

      const conflict = existing.find((p) =>
        p.id !== id &&
        p.isActive !== "false" &&
        timesOverlap(mergedStart, mergedEnd, p.startTime, p.endTime)
      );
      if (conflict) {
        return res.status(400).json({
          message: `Time conflict with existing ${conflict.label} (${conflict.startTime}–${conflict.endTime}).`,
        });
      }

      if (input.isActive === "true" && current.isActive === "false") {
        (input as any).emailSent = "false";
      }

      const period = await storage.updatePeriod(id, input);
      broadcast({ type: "period_updated", data: period });
      return res.json(period);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.admin.periods.delete.path, adminOnly, async (req, res) => {
    await storage.deletePeriod(Number(req.params.id));
    return res.status(204).end();
  });

  // ── Student routes ─────────────────────────────────────────────────────────
  const studentOnly = authenticateRole("student");

  app.get(api.student.activePeriod.get.path, studentOnly, async (_req, res) => {
    const period = await storage.getActivePeriodNow();
    return res.json({ period });
  });

  app.post(api.student.attendance.mark.path, studentOnly, async (req, res) => {
    try {
      const input = api.student.attendance.mark.input.parse(req.body);
      const user = await storage.getUser(req.user!.userId);
      if (!user || !user.faceEncoding) {
        return res.status(400).json({ message: "Face encoding not found for user" });
      }

      // ── Face verification ────────────────────────────────────────────────────
      const dist = euclideanDistance(user.faceEncoding as number[], input.faceEncoding);
      console.log(`[Attendance] Face distance for ${user.email}: ${dist}`);
      if (dist > 0.6) {
        return res.status(400).json({
          message: `Face verification failed (Score: ${dist.toFixed(4)}). Please ensure clear lighting.`,
        });
      }

      // ── Period validation ────────────────────────────────────────────────────
      let activePeriod = await storage.getActivePeriodNow();
      const periods = await storage.getPeriods();
      const hasPeriods = periods.length > 0;

      if (hasPeriods && !activePeriod) {
        const rawNow = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });
        const parts = formatter.formatToParts(rawNow);
        const hour = parts.find((p) => p.type === "hour")?.value;
        const min = parts.find((p) => p.type === "minute")?.value;
        const hhmm = `${hour}:${min}`.replace(/^24:/, "00:");

        let nextPeriodMsg = "";
        const upcoming = periods.filter(p => p.isActive !== "false" && p.startTime > hhmm);
        if (upcoming.length > 0) {
          upcoming.sort((a, b) => a.startTime.localeCompare(b.startTime));
          nextPeriodMsg = ` Next period starts at ${upcoming[0].startTime}.`;
        }

        return res.status(400).json({
          message: `Attendance is currently closed.${nextPeriodMsg}`,
        });
      }

      const periodIdToLog = activePeriod ? activePeriod.id : null;

      if (input.periodId && activePeriod && input.periodId !== activePeriod.id) {
        console.log(`[Attendance] Overriding client periodId ${input.periodId} with actual active period ${activePeriod.id}`);
      }

      // ── Duplicate check ──────────────────────────────────────────────────────
      const alreadyMarked = await storage.hasMarkedAttendanceForPeriod(
        user.id, periodIdToLog, new Date()
      );
      if (alreadyMarked) {
        const labelStr = activePeriod ? activePeriod.label : "today";
        return res.status(400).json({
          message: `You have already marked attendance for ${labelStr}. Duplicate entries are not allowed.`,
        });
      }

      // ── Geo verification ─────────────────────────────────────────────────────
      const settings = await storage.getSettings();
      const distance = getDistanceFromLatLonInM(
        settings.allowedLatitude, settings.allowedLongitude,
        input.latitude, input.longitude
      );
      console.log(`[Attendance] ${user.email} | Distance: ${distance}m | Allowed: ${settings.allowedRadius}m`);

      const status = distance <= settings.allowedRadius ? "PRESENT" : "ABSENT";
      const record = await storage.markAttendance({
        userId: user.id,
        periodId: periodIdToLog,
        periodNumber: activePeriod ? activePeriod.periodNumber : null,
        periodName: activePeriod ? activePeriod.label : null,
        startTime: activePeriod ? activePeriod.startTime : null,
        endTime: activePeriod ? activePeriod.endTime : null,
        date: new Date(),
        latitude: input.latitude,
        longitude: input.longitude,
        distanceFromCenter: distance,
        status,
      });

      broadcast({
        type: "attendance_new",
        data: {
          ...record,
          studentName: user.name,
          studentEmail: user.email,
          periodLabel: activePeriod ? activePeriod.label : "No Scheduled Class",
        },
      });

      const geoNote = status === "PRESENT"
        ? "Location verified."
        : `You are ${Math.round(distance)}m away from the center (Allowed: ${settings.allowedRadius}m).`;

      const sessionLabel = activePeriod ? activePeriod.label : "the day";

      return res.json({
        message: `Attendance submitted for ${sessionLabel} — awaiting Admin approval. ${geoNote}`,
        status: "PENDING",
        distance,
        period: activePeriod,
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.student.attendance.history.path, studentOnly, async (req, res) => {
    return res.json(await storage.getAttendanceHistory(req.user!.userId));
  });

  // ── Seed DB on startup ─────────────────────────────────────────────────────
  try {
    await seedDatabase();
  } catch (err: any) {
    console.error("[DB] Seed failed:", err.message);
    console.error("[DB] Server will still run. Check DATABASE_URL.");
  }


  // ── Start period scheduler ─────────────────────────────────────────────────
  startPeriodScheduler();

  return httpServer;
}

async function seedDatabase() {
  const users = await storage.getStudents();
  if (users.length === 0) {
    const existingAdmin = await storage.getUserByEmail("admin@example.com");
    if (!existingAdmin) {
      await storage.createUser({
        id: "ADMIN001", name: "Admin User", email: "admin@example.com",
        passwordHash: await bcrypt.hash("admin123", 10),
        role: "admin", faceEncoding: null,
      });
    }
  }
}