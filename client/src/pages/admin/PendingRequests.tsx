import { Layout } from "@/components/Layout";
import { usePendingAttendance, useApproveAttendance, useRejectAttendance, useStudents } from "@/hooks/use-admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Check, X, Loader2, MapPin, Clock, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PendingRequests() {
    const { data: pending, isLoading } = usePendingAttendance();
    const { data: students } = useStudents();
    const approveMutation = useApproveAttendance();
    const rejectMutation = useRejectAttendance();
    const { toast } = useToast();

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

    const pendingCount = pending?.length ?? 0;

    return (
        <Layout roleRequired="admin">
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
        </Layout>
    );
}
