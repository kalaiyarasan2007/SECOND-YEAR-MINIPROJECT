import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAttendanceHistory() {
  return useQuery({
    queryKey: [api.student.attendance.history.path],
    queryFn: async () => {
      const res = await fetch(api.student.attendance.history.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance history");
      return res.json();
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      latitude: number;
      longitude: number;
      faceEncoding: number[];
      periodId?: number;
    }) => {
      const res = await fetch(api.student.attendance.mark.path, {
        method: api.student.attendance.mark.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to mark attendance");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.student.attendance.history.path] });
    },
  });
}

export function useActivePeriod() {
  return useQuery({
    queryKey: [api.student.activePeriod.get.path],
    queryFn: async () => {
      const res = await fetch(api.student.activePeriod.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch active period");
      return res.json() as Promise<{ period: any | null }>;
    },
    refetchInterval: 30000, 
  });
}
