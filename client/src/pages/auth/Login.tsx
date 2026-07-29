import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useSession, useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Loader2, ScanFace, MapPin, ShieldCheck, GraduationCap, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Role Landing (pick a role if not specified) ────────────────────────────
function RolePicker() {
  const [, setLocation] = useLocation();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
            <ScanFace className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <h1 className="font-bold text-2xl text-white leading-none">GeoFace</h1>
            <p className="text-indigo-300/80 text-xs uppercase tracking-widest mt-0.5">Smart Attendance</p>
          </div>
        </div>

        <h2 className="text-4xl font-bold text-white mb-3">Welcome Back</h2>
        <p className="text-slate-400 text-lg mb-10">Choose your role to continue</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Student card */}
          <button
            onClick={() => {
              if (session?.student) {
                setLocation("/dashboard");
              } else {
                setLocation("/login?role=student");
              }
            }}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300 text-left hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-5 shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Student</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {session?.student
                ? `Signed in as ${session.student.name}`
                : "Mark attendance & view your history"}
            </p>
            {session?.student && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Active session
              </span>
            )}
            <ArrowRight className="absolute top-8 right-8 w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Admin card */}
          <button
            onClick={() => {
              if (session?.admin) {
                setLocation("/dashboard");
              } else {
                setLocation("/login?role=admin");
              }
            }}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300 text-left hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-5 shadow-lg">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Administrator</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {session?.admin
                ? `Signed in as ${session.admin.name}`
                : "Manage students & approve attendance"}
            </p>
            {session?.admin && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Active session
              </span>
            )}
            <ArrowRight className="absolute top-8 right-8 w-5 h-5 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        <p className="mt-8 text-slate-600 text-sm">
          Both sessions are independent — you can be logged in as both simultaneously.
        </p>
      </div>
    </div>
  );
}

// ─── Role-specific Login Form ────────────────────────────────────────────────
function LoginForm({ role }: { role: "admin" | "student" }) {
  const [, setLocation] = useLocation();
  const { data: session } = useSession();
  const login = useLogin(role);
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isAdmin = role === "admin";
  const accentFrom = isAdmin ? "from-purple-600" : "from-indigo-600";
  const accentTo = isAdmin ? "to-pink-600" : "to-blue-600";
  const Icon = isAdmin ? ShieldCheck : GraduationCap;
  const label = isAdmin ? "Admin" : "Student";
  const demoHint = isAdmin ? "admin@example.com / admin123" : "student@example.com / password";

  // Already logged in with this role → go straight to dashboard
  useEffect(() => {
    if (role === "admin" && session?.admin) {
      setLocation("/dashboard");
    } else if (role === "student" && session?.student) {
      setLocation("/dashboard");
    }
  }, [session, role, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password }, {
      onSuccess: () => {
        toast({ title: `Welcome, ${label}!`, description: "You are now signed in." });
        setLocation("/dashboard");
      },
      onError: (err: Error) => {
        toast({ title: "Login failed", description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left visual panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        <div className={`absolute inset-0 bg-gradient-to-br ${accentFrom} ${accentTo} opacity-90`} />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80')] bg-cover bg-center mix-blend-overlay opacity-20" />

        {/* Floating elements */}
        <div className="absolute top-16 left-16 w-32 h-32 rounded-full bg-white/10 animate-pulse" />
        <div className="absolute bottom-24 right-16 w-48 h-48 rounded-full bg-white/5 animate-pulse delay-500" />

        <div className="relative z-10 text-white max-w-lg px-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <Icon className="w-10 h-10" />
            </div>
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <MapPin className="w-10 h-10" />
            </div>
          </div>
          <h1 className="font-bold text-5xl mb-6 leading-tight">
            {isAdmin ? "Admin Control Center" : "Student Attendance Portal"}
          </h1>
          <p className="text-xl text-white/75 leading-relaxed">
            {isAdmin
              ? "Manage attendance, approve requests, and oversee your institution's daily operations."
              : "Verify your identity with facial recognition and geo-location to mark secure attendance."}
          </p>

          {/* Session indicator */}
          <div className="mt-10 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <p className="text-sm text-white/80 font-medium">
              🔒 Dual-session security — logging in here won't affect other active sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Back to role picker */}
          <button
            onClick={() => setLocation("/login")}
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to role selection
          </button>

          <Card className="shadow-2xl border-0 ring-1 ring-border/50 rounded-3xl overflow-hidden">
            {/* Colored top accent bar */}
            <div className={`h-1.5 bg-gradient-to-r ${accentFrom} ${accentTo}`} />

            <CardHeader className="space-y-3 pb-6 text-center pt-8">
              <div className={`w-16 h-16 bg-gradient-to-br ${accentFrom} ${accentTo} rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xl`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">{label} Sign In</CardTitle>
              <CardDescription className="text-base">
                Enter your {label.toLowerCase()} credentials to access the dashboard
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/50 border-transparent focus:bg-background focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/50 border-transparent focus:bg-background focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <Button
                  type="submit"
                  className={`w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r ${accentFrom} ${accentTo} rounded-xl mt-4`}
                  disabled={login.isPending}
                >
                  {login.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" />Signing in...</>
                  ) : (
                    <>Sign in as {label} <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </form>

              {/* Demo credentials */}
              <div className="mt-6 p-4 bg-secondary/50 rounded-2xl">
                <p className="text-xs text-muted-foreground text-center font-medium">
                  Demo: <span className="font-mono text-foreground">{demoHint}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Main Login component — reads ?role= query param ────────────────────────
export default function Login() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const role = params.get("role") as "admin" | "student" | null;

  if (role === "admin" || role === "student") {
    return <LoginForm role={role} />;
  }

  return <RolePicker />;
}
