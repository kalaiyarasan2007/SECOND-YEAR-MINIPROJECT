import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudents, useAllAttendance, usePendingAttendance } from "@/hooks/use-admin";
import { Users, ClipboardCheck, AlertTriangle, Clock } from "lucide-react";
import { format, isToday } from "date-fns";

export default function AdminDashboard() {
  const { data: students = [] } = useStudents();
  const { data: attendance = [] } = useAllAttendance();
  const { data: pendingList = [] } = usePendingAttendance();

  const todayAttendance = attendance.filter((a: any) => isToday(new Date(a.date)));
  const presentToday = todayAttendance.filter((a: any) => a.status === 'PRESENT' && a.approvalStatus === 'APPROVED').length;
  const absentToday = todayAttendance.filter((a: any) => a.status === 'ABSENT' || a.approvalStatus === 'REJECTED').length;
  const pendingCount = pendingList.length;

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
          <h1 className="font-display text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">Overview of system activity for today, {format(new Date(), 'MMMM d, yyyy')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-card to-secondary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Users className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-display font-bold text-foreground">{students.length}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-card to-amber-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-display font-bold text-foreground">{pendingCount}</div>
              {pendingCount > 0 && (
                <p className="text-xs text-amber-600 font-medium mt-1">Requires your attention</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-card to-green-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved Today</CardTitle>
              <div className="p-3 bg-green-500/10 rounded-xl text-green-600">
                <ClipboardCheck className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-display font-bold text-foreground">{presentToday}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-card to-red-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Absent/Rejected</CardTitle>
              <div className="p-3 bg-red-500/10 rounded-xl text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${record.status === 'PRESENT'
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-red-500/10 text-red-600'
                      }`}>
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
    </Layout>
  );
}

