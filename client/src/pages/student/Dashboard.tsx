import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAttendanceHistory, useMarkAttendance, useActivePeriod } from "@/hooks/use-student";
import { useGeolocation } from "@/hooks/use-geolocation";
import { FaceScanner } from "@/components/FaceScanner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { MapPin, MapPinOff, ScanFace, CheckCircle2, History, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudentDashboard() {
  const { data: history, isLoading: historyLoading } = useAttendanceHistory();
  const { data: activePeriodData } = useActivePeriod();
  const activePeriod = activePeriodData?.period;

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
      { latitude: location.latitude, longitude: location.longitude, faceEncoding: descriptor, periodId: activePeriod?.id },
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

  // Attendance stats
  const approvedCount = history?.filter((r: any) => r.approvalStatus === 'APPROVED').length ?? 0;
  const pendingCount = history?.filter((r: any) => r.approvalStatus === 'PENDING').length ?? 0;
  const rejectedCount = history?.filter((r: any) => r.approvalStatus === 'REJECTED').length ?? 0;

  return (
    <Layout roleRequired="student">
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
              {activePeriod ? (
                <div className="mb-6 p-4 bg-primary/10 rounded-2xl flex items-center justify-between border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-xl text-primary-foreground">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{activePeriod.label} Attendance Open</p>
                      <p className="text-sm text-primary/80">
                        {activePeriod.startTime} - {activePeriod.endTime}
                      </p>
                    </div>
                  </div>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-muted/50 rounded-2xl text-center border-2 border-dashed border-border/60">
                  <p className="font-medium text-muted-foreground">No active period currently.</p>
                  <p className="text-xs text-muted-foreground mt-1">If a period opens, you can mark attendance.</p>
                </div>
              )}

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
                    disabled={!activePeriod}
                    className="px-8 py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-primary to-indigo-600 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:pointer-events-none"
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
              {/* Stats Summary */}
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
    </Layout>
  );
}

