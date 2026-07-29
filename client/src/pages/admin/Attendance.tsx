import { Layout } from "@/components/Layout";
import { useAllAttendance, useDeleteAttendance, useStudents } from "@/hooks/use-admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Attendance() {
  const { data: attendance, isLoading } = useAllAttendance();
  const { data: students } = useStudents();
  const deleteMutation = useDeleteAttendance();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (confirm("Delete this record?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast({ title: "Deleted successfully" })
      });
    }
  };

  const getStudentName = (userId: number) => {
    if (!students) return `ID: ${userId}`;
    const student = students.find((s: any) => s.id === userId);
    return student ? student.name : `ID: ${userId}`;
  };

  const getApprovalBadge = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'APPROVED':
        return 'bg-green-500/10 text-green-600';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-600';
      case 'PENDING':
      default:
        return 'bg-amber-500/10 text-amber-600';
    }
  };

  return (
    <Layout roleRequired="admin">
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
                      <td className="p-5 whitespace-nowrap font-medium">
                        {format(new Date(record.date), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="p-5 font-medium">{getStudentName(record.userId)}</td>
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
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getApprovalBadge(record.approvalStatus)}`}>
                          {record.approvalStatus}
                        </span>
                      </td>
                      <td className="p-5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-primary/70" />
                          {Math.round(record.distanceFromCenter)}m from center
                        </div>
                        <div className="text-xs opacity-70 mt-1">[{record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}]</div>
                      </td>
                      <td className="p-5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(record.id)}
                          className="text-destructive hover:bg-destructive/10 rounded-xl hover:text-destructive"
                        >
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
    </Layout>
  );
}

