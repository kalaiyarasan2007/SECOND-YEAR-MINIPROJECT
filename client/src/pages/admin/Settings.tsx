import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useSettings, useUpdateSettings } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Target, Loader2 } from "lucide-react";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("");

  useEffect(() => {
    if (settings) {
      setLat(settings.allowedLatitude.toString());
      setLng(settings.allowedLongitude.toString());
      setRadius(settings.allowedRadius.toString());
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(
      { 
        allowedLatitude: parseFloat(lat), 
        allowedLongitude: parseFloat(lng), 
        allowedRadius: parseFloat(radius) 
      },
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
    <Layout roleRequired="admin">
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
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80')] bg-cover mix-blend-overlay opacity-20"></div>
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
    </Layout>
  );
}
