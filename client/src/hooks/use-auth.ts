/**
 * Dual-session authentication hooks.
 *
 * The server maintains TWO independent cookies:
 *   admin_token   → set when an admin logs in
 *   student_token → set when a student logs in
 *
 * /api/auth/me returns: { admin: User | null, student: User | null }
 *
 * This means both roles can be simultaneously active—switching views
 * never logs out the other role.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

// ── Shape of the dual-session response ──────────────────────────────────────
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
}

export interface DualSession {
  admin: SafeUser | null;
  student: SafeUser | null;
}

// ── Query key constant ───────────────────────────────────────────────────────
export const SESSION_KEY = [api.auth.me.path] as const;

// ── useSession — primary hook ────────────────────────────────────────────────
// Returns the full dual-session object { admin, student }.
export function useSession() {
  return useQuery<DualSession>({
    queryKey: SESSION_KEY,
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (!res.ok) return { admin: null, student: null };
      const data = await res.json();
      // Backwards compat: old server returned a single user object
      if (data && typeof data === "object" && !("admin" in data)) {
        // Single-user response from old backend — wrap it
        const user = data as SafeUser;
        return { admin: user.role === "admin" ? user : null, student: user.role === "student" ? user : null };
      }
      return data as DualSession;
    },
    retry: false,
    staleTime: 30_000, // 30 s — avoid hammering /me on every render
  });
}

// ── useLogin — role-specific login ───────────────────────────────────────────
// Pass `role` so the server can validate the account belongs to that role.
export function useLogin(role: "admin" | "student") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...credentials, role }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Login failed" }));
        throw new Error(err.message || "Login failed");
      }
      return res.json() as Promise<{ user: SafeUser }>;
    },
    onSuccess: ({ user }) => {
      // Optimistically update only the logged-in role slot
      queryClient.setQueryData<DualSession>(SESSION_KEY, (old) => {
        const base = old ?? { admin: null, student: null };
        return role === "admin" ? { ...base, admin: user } : { ...base, student: user };
      });
    },
  });
}

// ── useLogout — role-specific logout ─────────────────────────────────────────
// Clears only the specified role's session; the other role remains active.
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role?: "admin" | "student") => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(role ? { role } : {}),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
      return role;
    },
    onSuccess: (role) => {
      if (role) {
        // Only null out the specific role that was logged out
        queryClient.setQueryData<DualSession>(SESSION_KEY, (old) => {
          const base = old ?? { admin: null, student: null };
          return role === "admin" ? { ...base, admin: null } : { ...base, student: null };
        });
      } else {
        // Full logout — clear everything and redirect
        queryClient.setQueryData(SESSION_KEY, { admin: null, student: null });
        queryClient.clear();
        window.location.href = "/login";
      }
    },
  });
}

// ── Legacy compatibility ──────────────────────────────────────────────────────
// Keep useUser() and useLogin() default export so existing imports don't break.
// These resolve to the "primary" active user (admin > student).

/** @deprecated Use useSession() instead */
export function useUser() {
  const { data: session, ...rest } = useSession();
  // Resolve to admin if logged in as admin, else student, else null
  const user = session?.admin ?? session?.student ?? null;
  return { data: user, ...rest };
}
