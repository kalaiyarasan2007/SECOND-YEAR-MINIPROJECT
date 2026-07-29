import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

type WSEvent = {
    type:
    | "attendance_new"
    | "attendance_approved"
    | "attendance_rejected"
    | "attendance_approved"
    | "attendance_rejected"
    | "period_created"
    | "period_updated"
    | "period_started"
    | "period_ended"
    | "period_reminder_sent"
    | "connected";
    data?: any;
    message?: string;
};

/**
 * useWebSocket - Connects to the server WebSocket and automatically
 * invalidates React Query caches when attendance events occur.
 * This ensures both Admin and Student views update in real-time
 * without any manual refresh.
 */
export function useWebSocket() {
    const queryClient = useQueryClient();
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = useCallback(() => {
        // Build WS URL from current page location
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("[WS] Connected");
            };

            ws.onmessage = (event) => {
                try {
                    const parsed: WSEvent = JSON.parse(event.data);

                    switch (parsed.type) {
                        case "attendance_new":
                            // Admin: refresh pending list + all attendance
                            queryClient.invalidateQueries({ queryKey: [api.admin.attendance.pending.path] });
                            queryClient.invalidateQueries({ queryKey: [api.admin.attendance.list.path] });
                            break;

                        case "attendance_approved":
                        case "attendance_rejected":
                            // Admin: refresh pending + all attendance
                            queryClient.invalidateQueries({ queryKey: [api.admin.attendance.pending.path] });
                            queryClient.invalidateQueries({ queryKey: [api.admin.attendance.list.path] });
                            // Student: refresh their history to see updated status
                            queryClient.invalidateQueries({ queryKey: [api.student.attendance.history.path] });
                            break;

                        case "period_created":
                        case "period_updated":
                        case "period_started":
                        case "period_ended":
                            queryClient.invalidateQueries({ queryKey: [api.admin.periods.list.path] });
                            queryClient.invalidateQueries({ queryKey: [api.student.activePeriod.get.path] });
                            break;

                        case "connected":
                            // Initial connection message, no action needed
                            break;
                        case "period_reminder_sent":
                            break;
                    }
                } catch (e) {
                    // Ignore malformed messages
                }
            };

            ws.onclose = () => {
                console.log("[WS] Disconnected, reconnecting in 3s...");
                reconnectTimer.current = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                ws.close();
            };
        } catch (e) {
            // Retry connection
            reconnectTimer.current = setTimeout(connect, 3000);
        }
    }, [queryClient]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (wsRef.current) {
                wsRef.current.onclose = null; // Prevent reconnect on intentional close
                wsRef.current.close();
            }
        };
    }, [connect]);
}
