import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSession, useLogout } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";

// Student hooks & components
import { useAttendanceHistory, useMarkAttendance } from "@/hooks/use-student";
import { useGeolocation } from "@/hooks/use-geolocation";
import { FaceScanner } from "@/components/FaceScanner";

// Admin hooks
import {
    useStudents, useAllAttendance, usePendingAttendance,
    useApproveAttendance, useRejectAttendance,
    useSettings, useUpdateSettings,
    useCreateStudent, useDeleteStudent, useDeleteAttendance
} from "@/hooks/use-admin";

// UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format, isToday } from "date-fns";
import {
    LogOut, LayoutDashboard, Users, Settings, ClipboardList, UserCircle, Clock,
    Loader2, MapPin, MapPinOff, ScanFace, CheckCircle2, History, Check, X,
    ShieldCheck, Target, Plus, UserPlus, Fingerprint, Trash2, IdCard,
    ArrowLeftRight, GraduationCap, ShieldAlert, Bell, AlertTriangle, CalendarClock
} from "lucide-react";

// Admin Timetable Tab
import { AdminTimetableTab } from "./admin/Timetable";

// ─── STUDENT VIEW ────────────────────────────────────────────────
function StudentView() {
    const { data: history, isLoading: historyLoading } = useAttendanceHistory();
    const markAttendance = useMarkAttendance();
    const { location, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation();
    const { toast } = useToast();

    const [showScanner, setShowScanner] = useState(false);
    const [result, setResult] = useState<{ status: string, message: string } | null>(null);

    const startProcess = () => {
        setResult(null);
        requestLocation();
        setShowScanner(true);
    };

    const handleFaceCapture = (descriptor: number[]) => {
        if (!location) {
            toast({ title: "Error", description: "Location not found yet. Please try again.", variant: "destructive" });
            return;
        }
        markAttendance.mutate(
            { latitude: location.latitude, longitude: location.longitude, faceEncoding: descriptor },
            {
                onSuccess: (data) => {
                    setResult({ status: data.status, message: data.message });
                    setTimeout(() => setShowScanner(false), 5000);
                },
                onError: (err) => {
                    setResult({ status: 'ERROR', message: err.message });
                }
            }
        );
    };

    const getApprovalBadge = (approvalStatus: string) => {
        switch (approvalStatus) {
            case 'APPROVED':
                return { class: 'bg-green-500/10 text-green-600', label: '✅ Approved' };
            case 'REJECTED':
                return { class: 'bg-red-500/10 text-red-600', label: '❌ Rejected' };
            case 'PENDING':
            default:
                return { class: 'bg-amber-500/10 text-amber-600', label: '⏳ Pending' };
        }
    };

    const approvedCount = history?.filter((r: any) => r.approvalStatus === 'APPROVED').length ?? 0;
    const pendingCount = history?.filter((r: any) => r.approvalStatus === 'PENDING').length ?? 0;
    const rejectedCount = history?.filter((r: any) => r.approvalStatus === 'REJECTED').length ?? 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="font-display text-4xl font-bold tracking-tight">Student Portal</h1>
                <p className="text-muted-foreground mt-2 text-lg">Mark your daily attendance securely.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Marking Section */}
                <Card className="rounded-3xl shadow-xl border-0 ring-1 ring-border/50 overflow-hidden bg-card">
                    <div className="h-2 bg-gradient-to-r from-primary to-purple-500"></div>
                    <CardHeader className="pb-4">
                        <CardTitle className="font-display text-2xl flex items-center gap-2">
                            <ScanFace className="text-primary w-6 h-6" /> Daily Check-in
                        </CardTitle>
                        <CardDescription>Requires camera and location access.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!showScanner ? (
                            <div className="text-center py-10 space-y-6">
                                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                    <MapPin className="w-12 h-12 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Ready to mark attendance?</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">Make sure you are at the designated location and have adequate lighting for face recognition.</p>
                                </div>
                                <button
                                    onClick={startProcess}
                                    className="px-8 py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-primary to-indigo-600 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
                                >
                                    Start Verification
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                {geoLoading && (
                                    <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-700">
                                        <MapPin className="h-4 w-4" />
                                        <AlertTitle>Acquiring GPS Signal...</AlertTitle>
                                    </Alert>
                                )}
                                {geoError && (
                                    <Alert variant="destructive">
                                        <MapPinOff className="h-4 w-4" />
                                        <AlertTitle>Location Error</AlertTitle>
                                        <AlertDescription>{geoError}</AlertDescription>
                                    </Alert>
                                )}
                                {location && !result && (
                                    <Alert className="bg-green-500/10 border-green-500/20 text-green-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <AlertTitle>Location Verified</AlertTitle>
                                        <AlertDescription>Accuracy achieved. Please scan your face now.</AlertDescription>
                                    </Alert>
                                )}

                                {result ? (
                                    <div className={`p-8 rounded-2xl text-center border-2 ${result.status === 'ERROR'
                                        ? 'bg-red-50 border-red-200 text-red-800'
                                        : 'bg-amber-50 border-amber-200 text-amber-800'
                                        }`}>
                                        {result.status === 'ERROR' ? (
                                            <MapPinOff className="w-16 h-16 mx-auto mb-4 text-red-600" />
                                        ) : (
                                            <Clock className="w-16 h-16 mx-auto mb-4 text-amber-600" />
                                        )}
                                        <h3 className="text-2xl font-bold mb-2">
                                            {result.status === 'ERROR' ? 'Verification Failed' : 'Attendance Submitted!'}
                                        </h3>
                                        <p className="font-medium mb-1">
                                            {result.status === 'ERROR'
                                                ? 'Something went wrong.'
                                                : 'Your attendance is pending admin approval.'}
                                        </p>
                                        <p className="text-sm opacity-90">{result.message}</p>
                                        <button onClick={() => setShowScanner(false)} className="mt-6 text-sm underline opacity-80 hover:opacity-100">Go Back</button>
                                    </div>
                                ) : (
                                    <div className="pt-4">
                                        <FaceScanner
                                            onCapture={handleFaceCapture}
                                            isProcessing={markAttendance.isPending}
                                            buttonText="Verify Identity"
                                        />
                                        <div className="text-center mt-4">
                                            <button onClick={() => setShowScanner(false)} className="text-sm text-muted-foreground hover:text-foreground underline">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* History Section */}
                <Card className="rounded-3xl shadow-lg border-0 ring-1 ring-border/50 bg-secondary/20">
                    <CardHeader>
                        <CardTitle className="font-display text-xl flex items-center gap-2">
                            <History className="text-primary w-5 h-5" /> Recent History
                        </CardTitle>
                        {history && history.length > 0 && (
                            <div className="flex gap-3 mt-3">
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600">
                                    ✅ {approvedCount} Approved
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600">
                                    ⏳ {pendingCount} Pending
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600">
                                    ❌ {rejectedCount} Rejected
                                </span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {historyLoading ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl"></div>)}
                                </div>
                            ) : history?.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">No attendance records found.</div>
                            ) : (
                                history?.slice(0, 8).map((record: any) => {
                                    const badge = getApprovalBadge(record.approvalStatus);
                                    return (
                                        <div key={record.id} className="p-4 bg-card rounded-2xl shadow-sm border border-border flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{format(new Date(record.date), 'EEEE, MMM d')}</p>
                                                <p className="text-sm text-muted-foreground">{format(new Date(record.date), 'h:mm a')}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${record.status === 'PRESENT'
                                                    ? 'bg-green-500/10 text-green-600'
                                                    : 'bg-red-500/10 text-red-600'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${badge.class}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ─── ADMIN TABS ──────────────────────────────────────────────────

// Admin Overview Tab
function AdminOverview() {
    const { data: students = [] } = useStudents();
    const { data: attendance = [] } = useAllAttendance();
    const { data: pendingList = [] } = usePendingAttendance();

    const todayAttendance = attendance.filter((a: any) => isToday(new Date(a.date)));
    const presentToday = todayAttendance.filter((a: any) => a.status === 'PRESENT' && a.approvalStatus === 'APPROVED').length;
    const absentToday = todayAttendance.filter((a: any) => a.status === 'ABSENT' || a.approvalStatus === 'REJECTED').length;
    const pendingCount = pendingList.length;

    const getApprovalBadge = (approvalStatus: string) => {
        switch (approvalStatus) {
            case 'APPROVED': return 'bg-green-500/10 text-green-600';
            case 'REJECTED': return 'bg-red-500/10 text-red-600';
            default: return 'bg-amber-500/10 text-amber-600';
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2 text-lg">Overview of system activity for today, {format(new Date(), 'MMMM d, yyyy')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-card to-secondary/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                        <div className="p-3 bg-primary/10 rounded-xl text-primary"><Users className="w-5 h-5" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-display font-bold text-foreground">{students.length}</div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-card to-amber-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600"><Clock className="w-5 h-5" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-display font-bold text-foreground">{pendingCount}</div>
                        {pendingCount > 0 && <p className="text-xs text-amber-600 font-medium mt-1">Requires your attention</p>}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-card to-green-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Approved Today</CardTitle>
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-600"><CheckCircle2 className="w-5 h-5" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-display font-bold text-foreground">{presentToday}</div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-card to-red-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Absent/Rejected</CardTitle>
                        <div className="p-3 bg-red-500/10 rounded-xl text-red-600"><AlertTriangle className="w-5 h-5" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-display font-bold text-foreground">{absentToday}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-12">
                <h2 className="font-display text-2xl font-bold mb-6">Recent Activity</h2>
                <Card className="rounded-3xl shadow-md border border-border/50 overflow-hidden">
                    <div className="divide-y divide-border/50">
                        {attendance.slice(0, 5).map((record: any) => (
                            <div key={record.id} className="p-6 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                                <div>
                                    <p className="font-medium">Student ID: {record.userId}</p>
                                    <p className="text-sm text-muted-foreground">{format(new Date(record.date), 'PPpp')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${record.status === 'PRESENT' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                        {record.status}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getApprovalBadge(record.approvalStatus)}`}>
                                        {record.approvalStatus}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {attendance.length === 0 && (
                            <div className="p-12 text-center text-muted-foreground">No recent activity found.</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// Admin Pending Tab
function AdminPending() {
    const { data: pending, isLoading } = usePendingAttendance();
    const { data: students } = useStudents();
    const approveMutation = useApproveAttendance();
    const rejectMutation = useRejectAttendance();
    const { toast } = useToast();
    const pendingCount = pending?.length ?? 0;

    const getStudentName = (userId: string) => {
        if (!students) return `ID: ${userId}`;
        const student = students.find((s: any) => s.id === userId);
        return student ? student.name : `ID: ${userId}`;
    };

    const handleApprove = (id: number) => {
        approveMutation.mutate(id, {
            onSuccess: () => toast({ title: "✅ Attendance Approved", description: "The student's attendance has been confirmed." }),
            onError: () => toast({ title: "Error", description: "Failed to approve attendance.", variant: "destructive" }),
        });
    };

    const handleReject = (id: number) => {
        if (confirm("Are you sure you want to reject this attendance?")) {
            rejectMutation.mutate(id, {
                onSuccess: () => toast({ title: "❌ Attendance Rejected", description: "The student's attendance has been rejected." }),
                onError: () => toast({ title: "Error", description: "Failed to reject attendance.", variant: "destructive" }),
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl">
                    <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                    <h1 className="font-display text-4xl font-bold tracking-tight">Pending Requests</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        {pendingCount > 0
                            ? `${pendingCount} attendance request${pendingCount > 1 ? 's' : ''} awaiting your review.`
                            : "All caught up! No pending requests."}
                    </p>
                </div>
            </div>

            {pendingCount > 0 && (
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-xl">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">{pendingCount} Pending</span>
                    </div>
                </div>
            )}

            <Card className="rounded-3xl shadow-lg border-0 ring-1 ring-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-b border-border/50">
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Date & Time</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Student</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Period</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Geo Status</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Location Data</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
                            ) : pendingCount === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                                                <ShieldCheck className="w-10 h-10 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-foreground">All Clear!</p>
                                                <p className="text-muted-foreground">No pending attendance requests to review.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                pending?.map((record: any) => (
                                    <tr key={record.id} className="hover:bg-amber-500/5 transition-colors group">
                                        <td className="p-5 whitespace-nowrap font-medium">
                                            <div>{format(new Date(record.date), 'MMM d, yyyy')}</div>
                                            <div className="text-sm text-muted-foreground">{format(new Date(record.date), 'hh:mm a')}</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-semibold">{getStudentName(record.userId)}</div>
                                            <div className="text-sm text-muted-foreground">ID: {record.userId}</div>
                                        </td>
                                        <td className="p-5 text-sm">
                                            {record.periodNumber && record.periodName ? (
                                                <span className="font-semibold text-primary bg-primary/10 px-3 py-1 rounded-lg">{record.periodName}</span>
                                            ) : (
                                                <span className="text-muted-foreground italic">No Scheduled Class</span>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${record.status === 'PRESENT'
                                                ? 'bg-green-500/10 text-green-600'
                                                : 'bg-red-500/10 text-red-600'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4 text-primary/70" />
                                                {Math.round(record.distanceFromCenter)}m from center
                                            </div>
                                            <div className="text-xs opacity-70 mt-1">[{record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}]</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(record.id)}
                                                    disabled={approveMutation.isPending}
                                                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 shadow-md hover:shadow-lg transition-all"
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReject(record.id)}
                                                    disabled={rejectMutation.isPending}
                                                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl px-4 py-2 transition-all"
                                                >
                                                    <X className="w-4 h-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

// Admin Attendance Logs Tab
function AdminAttendanceLogs() {
    const { data: attendance, isLoading } = useAllAttendance();
    const { data: students } = useStudents();
    const deleteMutation = useDeleteAttendance();
    const { toast } = useToast();

    const handleDelete = (id: number) => {
        if (confirm("Delete this record?")) {
            deleteMutation.mutate(id, { onSuccess: () => toast({ title: "Deleted successfully" }) });
        }
    };

    const getStudentName = (userId: string) => {
        if (!students) return `ID: ${userId}`;
        const student = students.find((s: any) => s.id === userId);
        return student ? student.name : `ID: ${userId}`;
    };

    const getApprovalBadge = (approvalStatus: string) => {
        switch (approvalStatus) {
            case 'APPROVED': return 'bg-green-500/10 text-green-600';
            case 'REJECTED': return 'bg-red-500/10 text-red-600';
            default: return 'bg-amber-500/10 text-amber-600';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="font-display text-4xl font-bold tracking-tight">Attendance Logs</h1>
                <p className="text-muted-foreground mt-2 text-lg">Detailed history of all attendance attempts.</p>
            </div>

            <Card className="rounded-3xl shadow-lg border-0 ring-1 ring-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/50 border-b border-border/50">
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Date & Time</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Student</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Period</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Geo Status</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Approval</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Location Data</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading ? (
                                <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
                            ) : attendance?.length === 0 ? (
                                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No records found.</td></tr>
                            ) : (
                                attendance?.map((record: any) => (
                                    <tr key={record.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="p-5 whitespace-nowrap font-medium">{format(new Date(record.date), 'MMM d, yyyy HH:mm')}</td>
                                        <td className="p-5 font-medium">{getStudentName(record.userId)}</td>
                                        <td className="p-5 text-sm">
                                            {record.periodNumber && record.periodName ? (
                                                <span className="font-semibold text-primary bg-primary/10 px-3 py-1 rounded-lg">{record.periodName}</span>
                                            ) : (
                                                <span className="text-muted-foreground italic">No Scheduled Class</span>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${record.status === 'PRESENT' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getApprovalBadge(record.approvalStatus)}`}>
                                                {record.approvalStatus}
                                            </span>
                                        </td>
                                        <td className="p-5 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-primary/70" />{Math.round(record.distanceFromCenter)}m from center</div>
                                            <div className="text-xs opacity-70 mt-1">[{record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}]</div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)} className="text-destructive hover:bg-destructive/10 rounded-xl hover:text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

// Admin Students Tab
function AdminStudentsTab() {
    const { data: students = [], isLoading } = useStudents();
    const createStudent = useCreateStudent();
    const deleteStudent = useDeleteStudent();
    const { toast } = useToast();

    const [isOpen, setIsOpen] = useState(false);
    const [registerNumber, setRegisterNumber] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [faceEncoding, setFaceEncoding] = useState<number[] | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!faceEncoding) {
            toast({ title: "Error", description: "Please scan student's face first.", variant: "destructive" });
            return;
        }
        createStudent.mutate(
            { id: registerNumber, name, email, password, faceEncoding },
            {
                onSuccess: () => {
                    toast({ title: "Student created successfully" });
                    setIsOpen(false);
                    setRegisterNumber(""); setName(""); setEmail(""); setPassword(""); setFaceEncoding(null);
                },
                onError: (err) => toast({ title: "Failed to create student", description: err.message, variant: "destructive" })
            }
        );
    };

    const handleDelete = (id: string) => {
        deleteStudent.mutate(id, {
            onSuccess: () => toast({ title: "Student deleted successfully" }),
            onError: (err) => toast({ title: "Failed to delete student", description: err.message, variant: "destructive" })
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="font-display text-4xl font-bold tracking-tight">Manage Students</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Enroll students and manage their facial data.</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl h-12 px-6 shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-indigo-600">
                            <Plus className="w-5 h-5 mr-2" /> Enroll Student
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                        <div className="p-8">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="font-display text-2xl flex items-center gap-3">
                                    <UserPlus className="w-6 h-6 text-primary" /> Enroll New Student
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label className="flex items-center gap-2"><IdCard className="w-4 h-4" /> Student Register Number</Label>
                                        <Input required placeholder="e.g. 2024CS01" value={registerNumber} onChange={e => setRegisterNumber(e.target.value)} className="bg-secondary/50 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input required value={name} onChange={e => setName(e.target.value)} className="bg-secondary/50 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary/50 rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Temporary Password</Label>
                                    <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-secondary/50 rounded-xl" />
                                </div>
                                <div className="space-y-2 pt-2 border-t">
                                    <Label className="flex items-center gap-2"><Fingerprint className="w-4 h-4" /> Face Registration Data</Label>
                                    {faceEncoding ? (
                                        <div className="p-4 bg-green-500/10 text-green-700 rounded-xl border border-green-500/20 font-medium flex items-center justify-between">
                                            <span>Face data captured successfully!</span>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setFaceEncoding(null)} className="h-8 rounded-lg">Retake</Button>
                                        </div>
                                    ) : (
                                        <div className="mt-4">
                                            <FaceScanner onCapture={(desc) => setFaceEncoding(desc)} buttonText="Capture Student Face" />
                                        </div>
                                    )}
                                </div>
                                <Button type="submit" disabled={createStudent.isPending || !faceEncoding} className="w-full h-12 rounded-xl text-lg mt-6">
                                    {createStudent.isPending ? "Creating..." : "Save Student Profile"}
                                </Button>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="rounded-3xl shadow-md border-0 ring-1 ring-border/50">
                <div className="divide-y divide-border/50">
                    {isLoading ? (
                        <div className="p-12 text-center text-muted-foreground">Loading students...</div>
                    ) : students.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">No students enrolled yet.</div>
                    ) : (
                        students.filter((s: any) => s.role === 'student').map((student: any) => (
                            <div key={student.id} className="p-6 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-lg">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{student.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="bg-secondary px-2 py-0.5 rounded font-mono text-xs font-bold text-primary">{student.id}</span>
                                            <span>•</span>
                                            <span>{student.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div>
                                        {student.faceEncoding ? (
                                            <span className="px-3 py-1 bg-green-500/10 text-green-600 text-xs font-semibold rounded-full flex items-center gap-1"><ScanFace className="w-3 h-3" /> Biometric Active</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 text-xs font-semibold rounded-full">Missing Biometric</span>
                                        )}
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete <strong>{student.name}</strong> ({student.id})? This action cannot be undone and will delete all attendance records for this student.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(student.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}

// Admin Settings Tab
function AdminSettingsTab() {
    const { data: settings, isLoading } = useSettings();
    const updateSettings = useUpdateSettings();
    const { toast } = useToast();

    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [radius, setRadius] = useState("");
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Sync settings to form when loaded
    useEffect(() => {
        if (settings && !settingsLoaded) {
            setLat(settings.allowedLatitude.toString());
            setLng(settings.allowedLongitude.toString());
            setRadius(settings.allowedRadius.toString());
            setSettingsLoaded(true);
        }
    }, [settings, settingsLoaded]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings.mutate(
            { allowedLatitude: parseFloat(lat), allowedLongitude: parseFloat(lng), allowedRadius: parseFloat(radius) },
            {
                onSuccess: () => toast({ title: "Settings updated successfully" }),
                onError: (err) => toast({ title: "Failed to update", description: err.message, variant: "destructive" })
            }
        );
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({ title: "Error", description: "Geolocation not supported", variant: "destructive" });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude.toString());
                setLng(pos.coords.longitude.toString());
                toast({ title: "Location captured" });
            },
            (err) => toast({ title: "Location error", description: err.message, variant: "destructive" })
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="font-display text-4xl font-bold tracking-tight">Geofence Settings</h1>
                <p className="text-muted-foreground mt-2 text-lg">Define the geographic boundary where attendance is accepted.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
                <Card className="rounded-3xl shadow-xl border-0 ring-1 ring-border/50 max-w-2xl overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary/20 to-purple-500/20 relative">
                        <div className="absolute -bottom-8 left-8 w-16 h-16 bg-card rounded-2xl shadow-lg flex items-center justify-center border border-border">
                            <Target className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardHeader className="pt-12 pb-6">
                        <CardTitle className="font-display text-2xl">Location Parameters</CardTitle>
                        <CardDescription>Center coordinates and accepted radius in meters.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="font-semibold">Center Latitude</Label>
                                    <Input required type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} className="bg-secondary/50 rounded-xl h-12" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="font-semibold">Center Longitude</Label>
                                    <Input required type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} className="bg-secondary/50 rounded-xl h-12" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="font-semibold">Allowed Radius (meters)</Label>
                                <Input required type="number" value={radius} onChange={e => setRadius(e.target.value)} className="bg-secondary/50 rounded-xl h-12" />
                                <p className="text-sm text-muted-foreground">Students must be within this distance to mark attendance.</p>
                            </div>
                            <div className="flex gap-4 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={handleGetCurrentLocation} className="rounded-xl h-12 flex-1 border-primary/20 hover:bg-primary/5 text-primary">
                                    <MapPin className="w-5 h-5 mr-2" /> Use My Current Location
                                </Button>
                                <Button type="submit" disabled={updateSettings.isPending} className="rounded-xl h-12 flex-1 shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-indigo-600">
                                    {updateSettings.isPending ? "Saving..." : "Save Settings"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ─── ADMIN VIEW WITH TABS ────────────────────────────────────────
function AdminView() {
    const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'timetable' | 'attendance' | 'students' | 'settings'>('overview');
    const { data: pendingData } = usePendingAttendance();
    const pendingCount = Array.isArray(pendingData) ? pendingData.length : 0;

    const tabs = [
        { id: 'overview' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pending' as const, label: 'Pending', icon: Clock, badge: pendingCount },
        { id: 'timetable' as const, label: 'Timetable', icon: CalendarClock },
        { id: 'attendance' as const, label: 'Attendance', icon: ClipboardList },
        { id: 'students' as const, label: 'Students', icon: Users },
        { id: 'settings' as const, label: 'Settings', icon: Settings },
    ];

    return (
        <div className="space-y-6">
            {/* Tab navigation */}
            <div className="flex gap-2 bg-secondary/50 p-1.5 rounded-2xl overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
              ${activeTab === tab.id
                                ? 'bg-card text-foreground shadow-md'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white animate-pulse">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && <AdminOverview />}
            {activeTab === 'pending' && <AdminPending />}
            {activeTab === 'timetable' && <AdminTimetableTab />}
            {activeTab === 'attendance' && <AdminAttendanceLogs />}
            {activeTab === 'students' && <AdminStudentsTab />}
            {activeTab === 'settings' && <AdminSettingsTab />}
        </div>
    );
}

// ─── ROLE-GATED VIEW WRAPPER ─────────────────────────────────────
// Shows a login prompt inline if the user isn't authenticated for the requested role.
function RoleGate({ role, children }: { role: 'student' | 'admin'; children: React.ReactNode }) {
    const [, setLocation] = useLocation();
    const { data: session, isLoading } = useSession();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const isAuthenticated = role === 'admin' ? !!session?.admin : !!session?.student;

    if (!isAuthenticated) {
        const Icon = role === 'admin' ? ShieldAlert : GraduationCap;
        const label = role === 'admin' ? 'Admin' : 'Student';
        const accentColor = role === 'admin' ? 'text-purple-600' : 'text-indigo-600';
        const bgColor = role === 'admin' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-indigo-500/10 border-indigo-500/20';
        const btnGradient = role === 'admin'
            ? 'from-purple-600 to-pink-600'
            : 'from-indigo-600 to-blue-600';

        return (
            <div className="flex flex-col items-center justify-center py-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-8 rounded-3xl border ${bgColor} text-center max-w-md w-full`}>
                    <div className={`w-20 h-20 rounded-full ${bgColor} flex items-center justify-center mx-auto mb-5`}>
                        <Icon className={`w-10 h-10 ${accentColor}`} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        {label} Login Required
                    </h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                        You need to sign in with a <strong>{label}</strong> account to access this section.
                        Your other session (if any) will remain active.
                    </p>
                    <button
                        onClick={() => setLocation(`/login?role=${role}`)}
                        className={`w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r ${btnGradient} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
                    >
                        Sign in as {label} →
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

// ─── MAIN UNIFIED DASHBOARD ─────────────────────────────────────
export default function UnifiedDashboard() {
    const { data: session, isLoading } = useSession();
    const logout = useLogout();
    const [, setLocation] = useLocation();
    const [activeRole, setActiveRole] = useState<'student' | 'admin'>('student');
    const [initialized, setInitialized] = useState(false);

    // Activate real-time WebSocket updates
    useWebSocket();

    // On first load, default to whichever role is logged in (admin takes priority if both)
    useEffect(() => {
        if (session && !initialized) {
            if (session.admin) setActiveRole('admin');
            else if (session.student) setActiveRole('student');
            setInitialized(true);
        }
    }, [session, initialized]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Neither role is logged in → redirect to role picker
    if (!session?.admin && !session?.student) {
        setLocation('/login');
        return null;
    }

    // Determine the currently viewed user for header display
    const currentUser = activeRole === 'admin' ? session?.admin : session?.student;
    const displayUser = currentUser ?? session?.admin ?? session?.student;

    return (
        <div className="min-h-screen bg-secondary/30">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                                <ScanFace className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-display font-bold text-lg text-foreground leading-none">GeoFace</h1>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Smart Attendance</p>
                            </div>
                        </div>

                        {/* Role Switcher — Center */}
                        <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border/50">
                            {/* Student tab */}
                            <button
                                id="role-switch-student"
                                onClick={() => setActiveRole('student')}
                                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                  ${activeRole === 'student'
                                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <GraduationCap className="w-4 h-4" />
                                Student
                                {/* Session indicator dot */}
                                {session?.student && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" title="Active session" />
                                )}
                            </button>

                            {/* Admin tab */}
                            <button
                                id="role-switch-admin"
                                onClick={() => setActiveRole('admin')}
                                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                  ${activeRole === 'admin'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <ShieldAlert className="w-4 h-4" />
                                Admin
                                {/* Session indicator dot */}
                                {session?.admin && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" title="Active session" />
                                )}
                            </button>
                        </div>

                        {/* User Info & Logout */}
                        <div className="flex items-center gap-3">
                            {/* Show both session badges if dual-logged-in */}
                            <div className="hidden sm:flex items-center gap-2">
                                {session?.student && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                                        <span className="text-xs font-semibold text-indigo-700">{session.student.name.split(' ')[0]}</span>
                                        <button
                                            onClick={() => logout.mutate('student')}
                                            className="ml-1 text-indigo-400 hover:text-red-500 transition-colors text-xs"
                                            title="Logout as student"
                                        >✕</button>
                                    </div>
                                )}
                                {session?.admin && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                        <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                                        <span className="text-xs font-semibold text-purple-700">{session.admin.name.split(' ')[0]}</span>
                                        <button
                                            onClick={() => logout.mutate('admin')}
                                            className="ml-1 text-purple-400 hover:text-red-500 transition-colors text-xs"
                                            title="Logout as admin"
                                        >✕</button>
                                    </div>
                                )}
                            </div>

                            {/* Full logout button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                                onClick={() => logout.mutate(undefined)}
                                disabled={logout.isPending}
                                title="Logout all sessions"
                            >
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Role indicator banner */}
                <div className={`mb-6 p-3 rounded-2xl flex items-center gap-3 text-sm font-medium transition-all duration-300 ${activeRole === 'student'
                    ? 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20'
                    : 'bg-purple-500/10 text-purple-700 border border-purple-500/20'
                    }`}>
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>
                        Viewing the <strong>{activeRole === 'student' ? 'Student' : 'Admin'}</strong> interface
                        {displayUser && <span className="ml-1 opacity-70">— logged in as <strong>{displayUser.name}</strong></span>}
                    </span>
                </div>

                {/* Render the active view — guarded by RoleGate */}
                {activeRole === 'student' ? (
                    <RoleGate role="student"><StudentView /></RoleGate>
                ) : (
                    <RoleGate role="admin"><AdminView /></RoleGate>
                )}
            </main>
        </div>
    );
}
