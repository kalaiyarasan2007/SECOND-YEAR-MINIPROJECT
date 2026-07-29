import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import AdminSettings from "./pages/admin/Settings";
import AdminAttendance from "./pages/admin/Attendance";
import AdminPendingRequests from "./pages/admin/PendingRequests";
import AdminTimetable from "./pages/admin/Timetable";
import StudentDashboard from "./pages/student/Dashboard";
import UnifiedDashboard from "./pages/UnifiedDashboard";

function Router() {
  return (
    <Switch>
      {/* Root → role picker */}
      <Route path="/" component={() => <Redirect to="/login" />} />

      {/* Login — single component handles both role picker + role-specific form */}
      <Route path="/login" component={Login} />

      {/* Unified Dashboard — single screen with role-based switching */}
      <Route path="/dashboard" component={UnifiedDashboard} />

      {/* Legacy Admin Routes (still functional) */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/students" component={AdminStudents} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/attendance" component={AdminAttendance} />
      <Route path="/admin/pending" component={AdminPendingRequests} />
      <Route path="/admin/timetable" component={AdminTimetable} />

      {/* Legacy Student Routes (still functional) */}
      <Route path="/student" component={StudentDashboard} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
