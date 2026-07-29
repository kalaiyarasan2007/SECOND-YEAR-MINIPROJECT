import { useState } from "react";
import { usePeriods, useCreatePeriod, useUpdatePeriod, useDeletePeriod } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarClock, Plus, Edit2, Trash2, Clock, Loader2 } from "lucide-react";

export function AdminTimetableTab() {
    const { data: periods = [], isLoading } = usePeriods();
    const createPeriod = useCreatePeriod();
    const updatePeriod = useUpdatePeriod();
    const deletePeriod = useDeletePeriod();
    const { toast } = useToast();

    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [periodNumber, setPeriodNumber] = useState<number>(1);
    const [label, setLabel] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const resetForm = () => {
        setPeriodNumber(periods.length + 1);
        setLabel("");
        setStartTime("");
        setEndTime("");
        setEditingId(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsOpen(true);
    };

    const handleOpenEdit = (period: any) => {
        setEditingId(period.id);
        setPeriodNumber(period.periodNumber);
        setLabel(period.label);
        setStartTime(period.startTime);
        setEndTime(period.endTime);
        setIsOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            updatePeriod.mutate(
                { id: editingId, periodNumber, label, startTime, endTime },
                {
                    onSuccess: () => {
                        toast({ title: "Period updated successfully" });
                        setIsOpen(false);
                        resetForm();
                    },
                    onError: (err) => toast({ title: "Failed to update period", description: err.message, variant: "destructive" })
                }
            );
        } else {
            createPeriod.mutate(
                { periodNumber, label, startTime, endTime },
                {
                    onSuccess: () => {
                        toast({ title: "Period created successfully" });
                        setIsOpen(false);
                        resetForm();
                    },
                    onError: (err) => toast({ title: "Failed to create period", description: err.message, variant: "destructive" })
                }
            );
        }
    };

    const handleDelete = (id: number) => {
        deletePeriod.mutate(id, {
            onSuccess: () => toast({ title: "Period deleted successfully" }),
            onError: (err) => toast({ title: "Failed to delete period", description: err.message, variant: "destructive" })
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                        <CalendarClock className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="font-display text-4xl font-bold tracking-tight">Timetable</h1>
                        <p className="text-muted-foreground mt-2 text-lg">Manage daily periods for attendance and alerts.</p>
                    </div>
                </div>
                <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenCreate} className="rounded-xl h-12 px-6 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <Plus className="w-5 h-5 mr-2" /> Add Period
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                        <div className="p-8">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="font-display text-2xl flex items-center gap-3">
                                    <Clock className="w-6 h-6 text-blue-600" />
                                    {editingId ? "Edit Period" : "Create New Period"}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Period Number</Label>
                                    <Input
                                        type="number"
                                        required
                                        min={1}
                                        value={periodNumber}
                                        onChange={e => setPeriodNumber(parseInt(e.target.value))}
                                        className="bg-secondary/50 rounded-xl"
                                    />
                                    <p className="text-xs text-muted-foreground">Used for ordering periods.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Period Name / Label</Label>
                                    <Input
                                        required
                                        placeholder="e.g. Period 1"
                                        value={label}
                                        onChange={e => setLabel(e.target.value)}
                                        className="bg-secondary/50 rounded-xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Time</Label>
                                        <Input
                                            type="time"
                                            required
                                            value={startTime}
                                            onChange={e => setStartTime(e.target.value)}
                                            className="bg-secondary/50 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Time</Label>
                                        <Input
                                            type="time"
                                            required
                                            value={endTime}
                                            onChange={e => setEndTime(e.target.value)}
                                            className="bg-secondary/50 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={createPeriod.isPending || updatePeriod.isPending}
                                    className="w-full h-12 rounded-xl text-lg mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg"
                                >
                                    {(createPeriod.isPending || updatePeriod.isPending) ? "Saving..." : "Save Period"}
                                </Button>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="rounded-3xl shadow-lg border-0 ring-1 ring-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/50 border-b border-border/50">
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Order</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Period Name</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Start Time</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider">End Time</th>
                                <th className="p-5 font-semibold text-sm text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                    </td>
                                </tr>
                            ) : periods.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                                                <CalendarClock className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-foreground">No Periods Configured</p>
                                                <p className="text-muted-foreground">Add teaching periods to enable attendance constraints.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                periods.map((period: any) => (
                                    <tr key={period.id} className="hover:bg-secondary/20 transition-colors group">
                                        <td className="p-5">
                                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                                                {period.periodNumber}
                                            </div>
                                        </td>
                                        <td className="p-5 font-medium">{period.label}</td>
                                        <td className="p-5">
                                            <span className="px-3 py-1 bg-blue-500/10 text-blue-700 font-semibold rounded-lg">
                                                {period.startTime}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-700 font-semibold rounded-lg">
                                                {period.endTime}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenEdit(period)}
                                                    className="text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 rounded-xl"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-3xl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Period?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete <strong>{period.label}</strong>? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(period.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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

// Wrapper for the legacy route
import { Layout } from "@/components/Layout";
export default function Timetable() {
    return (
        <Layout roleRequired="admin">
            <AdminTimetableTab />
        </Layout>
    );
}
