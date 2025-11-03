import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
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
import { PostureAssessments } from "@/pages/posture-assessments";
import Progress from "@/pages/progress";
import Finances from "@/pages/finances";
import Anamneses from "@/pages/anamneses";
import TeacherProfile from "@/pages/teacher-profile";
import TeacherBodyEvolution from "@/pages/teacher-body-evolution";
import StudentProfile from "@/pages/student-profile";
import { StudentDashboard } from "@/pages/student-dashboard";
import StudentSetupPassword from "@/pages/student-setup-password";
import { StudentApp } from "@/pages/student-app";
import NotFound from "@/pages/not-found";
import AreaSelection from "@/pages/area-selection";
import Sidebar from "@/components/layout/sidebar";
import { StudentLayout } from "@/components/layout/student-layout";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
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

  // Layout wrapper para rotas do professor
  const TeacherLayout = ({ children }: { children: React.ReactNode }) => {
    const { isCollapsed } = useSidebar();

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

    return (
      <div className="flex">
        <Sidebar />
        <main
          className={`flex-1 p-6 bg-background min-h-screen transition-all duration-300 ${
            isCollapsed ? "ml-20" : "ml-64"
          }`}
        >
          {children}
        </main>
      </div>
    );
  };

  return (
    <Switch>
      <Route path="/student/setup-password" component={StudentSetupPassword} />
      <Route path="/student-area/:rest?">{() => <StudentApp />}</Route>

      {/* Rotas do professor - rotas específicas ANTES da genérica */}
      <Route path="/teacher-area/physical-assessments">
        {() => (
          <TeacherLayout>
            <PhysicalAssessments />
          </TeacherLayout>
        )}
      </Route>
      <Route path="/teacher-area/posture-assessments">
        {() => (
          <TeacherLayout>
            <PostureAssessments />
          </TeacherLayout>
        )}
      </Route>
      <Route path="/teacher-area/students">
        {() => (
          <TeacherLayout>
            <Students />
          </TeacherLayout>
        )}
      </Route>
      <Route path="/teacher-area/workouts">
        {() => (
          <TeacherLayout>
            <Workouts />
          </TeacherLayout>
        )}
      </Route>
      <Route path="/teacher-area/assessments">
        {() => (
          <TeacherLayout>
            <Progress />
          </TeacherLayout>
        )}
      </Route>
      <Route path="/teacher-area/progress">
        {() => (
          <TeacherLayout>
            <Progress />
          </TeacherLayout>
        )}
      </Route>
      <Route path="/teacher-area/finances">
        {() => (
          <TeacherLayout>
            <Finances />
          </TeacherLayout>
        )}
      </Route>
      <Route path="/teacher-area/anamneses">
        {() => (
          <TeacherLayout>
            <Anamneses />
          </TeacherLayout>
        )}
      </Route>
      <Route path="/teacher-area/profile">
        {() => (
          <TeacherLayout>
            <TeacherProfile />
          </TeacherLayout>
        )}
      </Route>
      <Route path="/teacher-area/body-evolution">
        {() => (
          <TeacherLayout>
            <TeacherBodyEvolution />
          </TeacherLayout>
        )}
      </Route>
      <Route path="/teacher-area">
        {() => (
          <TeacherLayout>
            <Dashboard />
          </TeacherLayout>
        )}
      </Route>

      <Route>
        {() => {
          // Component para redirecionamento seguro
          const SafeRedirect = () => {
            useEffect(() => {
              if (isAuthenticated && authUser?.role) {
                if (authUser.role === "teacher") {
                  setLocation("/teacher-area");
                } else if (authUser.role === "student") {
                  setLocation("/student-area");
                }
              }
            }, [isAuthenticated, authUser?.role]);

            // Fallback para seleção de área se não houver role definido
            if (isAuthenticated && !authUser?.role) {
              return (
                <AreaSelection userRole={authUser?.role} onLogout={logout} />
              );
            }

            // Mostra loading enquanto redireciona
            return (
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            );
          };

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

          return <SafeRedirect />;
        }}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;
