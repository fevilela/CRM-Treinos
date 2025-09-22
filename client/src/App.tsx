import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Workouts from "@/pages/workouts";
import PhysicalAssessments from "@/pages/physical-assessments";
import Progress from "@/pages/progress";
import Finances from "@/pages/finances";
import TeacherProfile from "@/pages/teacher-profile";
import StudentProfile from "@/pages/student-profile";
import { StudentDashboard } from "@/pages/student-dashboard";
import StudentSetupPassword from "@/pages/student-setup-password";
import { StudentApp } from "@/pages/student-app";
import NotFound from "@/pages/not-found";
import AreaSelection from "@/pages/area-selection";
import Sidebar from "@/components/layout/sidebar";
import { StudentLayout } from "@/components/layout/student-layout";
import type { Student } from "@shared/schema";

// Definir tipo para o usuário baseado no schema
interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "teacher" | "student";
  profileImageUrl?: string;
}

function Router() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Type assertion do user baseado na estrutura do schema
  const authUser = user as AuthUser;

  // Função personalizada para redirecionamento após login
  const handleLoginSuccess = async () => {
    try {
      // Recarrega os dados do usuário de forma determinística
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });

      // Vai para página de seleção de área após login bem-sucedido
      setLocation("/");
    } catch (error) {
      console.error("Error during login redirect:", error);
      // Em caso de erro, recarrega a página como fallback
      window.location.reload();
    }
  };

  return (
    <Switch>
      <Route path="/student/setup-password" component={StudentSetupPassword} />
      <Route path="/student-area">{() => <StudentApp />}</Route>

      <Route path="/teacher-area">
        {() => {
          if (isLoading) {
            return (
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            );
          }

          if (!isAuthenticated) {
            return <LoginPage onSuccess={handleLoginSuccess} />;
          }

          // Interface completa para professores
          return (
            <div className="flex">
              <Sidebar />
              <main className="flex-1 p-6 bg-background min-h-screen ml-64">
                <Switch>
                  <Route path="/teacher-area" component={Dashboard} />
                  <Route path="/teacher-area/students" component={Students} />
                  <Route path="/teacher-area/workouts" component={Workouts} />
                  <Route
                    path="/teacher-area/physical-assessments"
                    component={() => <PhysicalAssessments />}
                  />
                  <Route path="/teacher-area/progress" component={Progress} />
                  <Route path="/teacher-area/finances" component={Finances} />
                  <Route
                    path="/teacher-area/profile"
                    component={TeacherProfile}
                  />
                  <Route component={NotFound} />
                </Switch>
              </main>
            </div>
          );
        }}
      </Route>

      <Route>
        {() => {
          if (isLoading) {
            return (
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            );
          }

          if (!isAuthenticated) {
            return <LoginPage onSuccess={handleLoginSuccess} />;
          }

          // Página de seleção de área para usuários autenticados
          return <AreaSelection userRole={authUser?.role} onLogout={logout} />;
        }}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
