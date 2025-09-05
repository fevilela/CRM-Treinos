import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import ProgressChart from "@/components/dashboard/progress-chart";
import BodyPhotoGallery from "@/components/dashboard/body-photo-gallery";
import StudentList from "@/components/dashboard/student-list";
import ActivityFeed from "@/components/dashboard/activity-feed";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Dashboard"
        subtitle="Visão geral do seu sistema de treinos"
      />

      <main className="p-6">
        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProgressChart />
          <BodyPhotoGallery photos={[]} interactive={false} measurements={{}} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StudentList />
          </div>
          <ActivityFeed />
        </div>
      </main>
    </div>
  );
}
