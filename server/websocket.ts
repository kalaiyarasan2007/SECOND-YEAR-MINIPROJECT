import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

let wss: WebSocketServer;

export function setupWebSocket(httpServer: Server) {
    wss = new WebSocketServer({ server: httpServer, path: "/ws" });

    wss.on("connection", (ws) => {
        console.log("[WS] Client connected. Total:", wss.clients.size);

        ws.on("close", () => {
            console.log("[WS] Client disconnected. Total:", wss.clients.size);
        });

        ws.on("error", (err) => {
            console.error("[WS] Error:", err.message);
        });

        // Send a welcome message
        ws.send(JSON.stringify({ type: "connected", message: "WebSocket connected" }));
    });

    console.log("[WS] WebSocket server initialized on /ws");
}

export function broadcast(event: {
    type: "attendance_new" | "attendance_approved" | "attendance_rejected" | "period_created" | "period_updated" | "period_started" | "period_ended" | "period_reminder_sent";
    data: any;
}) {
    if (!wss) return;

    const message = JSON.stringify(event);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}
