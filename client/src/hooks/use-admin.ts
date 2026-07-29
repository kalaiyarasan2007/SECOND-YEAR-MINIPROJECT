import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// ── Students ──────────────────────────────────────────────────────────────────

export function useStudents() {
  return useQuery({
    queryKey: [api.admin.students.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.students.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.admin.students.create.path, {
        method: api.admin.students.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create student");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.students.list.path] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.admin.students.delete.path, { id });
      const res = await fetch(url, {
        method: api.admin.students.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete student");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.students.list.path] });
    },
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function useSettings() {
  return useQuery({
    queryKey: [api.admin.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.admin.settings.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.admin.settings.update.path, {
        method: api.admin.settings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.settings.get.path] });
    },
  });
}

// ── Attendance ────────────────────────────────────────────────────────────────

export function useAllAttendance() {
  return useQuery({
    queryKey: [api.admin.attendance.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.attendance.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
  });
}

export function usePendingAttendance() {
  return useQuery({
    queryKey: [api.admin.attendance.pending.path],
    queryFn: async () => {
      const res = await fetch(api.admin.attendance.pending.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pending attendance");
      return res.json();
    },
    refetchInterval: 5000,
  });
}

export function useApproveAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.attendance.approve.path, { id });
      const res = await fetch(url, {
        method: api.admin.attendance.approve.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve attendance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.attendance.pending.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.attendance.list.path] });
    },
  });
}

export function useRejectAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.attendance.reject.path, { id });
      const res = await fetch(url, {
        method: api.admin.attendance.reject.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject attendance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.attendance.pending.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.attendance.list.path] });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.attendance.delete.path, { id });
      const res = await fetch(url, {
        method: api.admin.attendance.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete attendance");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.attendance.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.attendance.pending.path] });
    },
  });
}

// ── Periods (Timetable) ────────────────────────────────────────────────────────

export function usePeriods() {
  return useQuery({
    queryKey: [api.admin.periods.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.periods.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch periods");
      return res.json();
    },
  });
}

export function useCreatePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.admin.periods.create.path, {
        method: api.admin.periods.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create period");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.periods.list.path] });
    },
  });
}

export function useUpdatePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & any) => {
      const url = buildUrl(api.admin.periods.update.path, { id });
      const res = await fetch(url, {
        method: api.admin.periods.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update period");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.periods.list.path] });
    },
  });
}

export function useDeletePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.periods.delete.path, { id });
      const res = await fetch(url, {
        method: api.admin.periods.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete period");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.periods.list.path] });
    },
  });
}

