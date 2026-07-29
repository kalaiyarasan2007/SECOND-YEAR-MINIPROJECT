import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useStudents, useCreateStudent, useDeleteStudent } from "@/hooks/use-admin";
import { FaceScanner } from "@/components/FaceScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserPlus, Fingerprint, ScanFace, Trash2, IdCard } from "lucide-react";

export default function Students() {
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
        onError: (err) => {
          toast({ title: "Failed to create student", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteStudent.mutate(id, {
      onSuccess: () => {
        toast({ title: "Student deleted successfully" });
      },
      onError: (err) => {
        toast({ title: "Failed to delete student", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Layout roleRequired="admin">
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
                      <Input
                        required
                        placeholder="e.g. 2024CS01"
                        value={registerNumber}
                        onChange={e => setRegisterNumber(e.target.value)}
                        className="bg-secondary/50 rounded-xl"
                      />
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
                        <FaceScanner
                          onCapture={(desc) => setFaceEncoding(desc)}
                          buttonText="Capture Student Face"
                        />
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
                          <AlertDialogAction
                            onClick={() => handleDelete(student.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                          >
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
    </Layout>
  );
}
