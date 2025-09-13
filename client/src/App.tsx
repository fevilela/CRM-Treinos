import { Switch, Route } from "wouter";
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
import { StudentDashboard } from "@/pages/student-dashboard";
import StudentSetupPassword from "@/pages/student-setup-password";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import StudentSidebar from "@/components/layout/student-sidebar";
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

// Componente para interface de aluno que busca o student record correto
function StudentInterface({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}) {
  // Busca o student record baseado no usuário autenticado
  const {
    data: student,
    isLoading: studentLoading,
    error,
  } = useQuery<Student>({
    queryKey: ["/api/auth/student/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/student/me", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.student) {
        return result.student;
      }
      throw new Error("Invalid response format");
    },
    enabled: user.role === "student",
  });

  if (studentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            Erro de Ligação de Conta
          </h2>
          <p className="text-gray-600 mb-4">
            Não foi possível encontrar seu registro de aluno.
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com seu personal trainer para resolver este
            problema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <StudentSidebar student={student} onLogout={onLogout} />
      <main className="flex-1 p-6 bg-gray-50 min-h-screen ml-64">
        <Switch>
          <Route
            path="/"
            component={() => (
              <StudentDashboard student={student} onLogout={onLogout} />
            )}
          />
          <Route
            path="/student"
            component={() => (
              <StudentDashboard student={student} onLogout={onLogout} />
            )}
          />
          <Route path="/student/progress" component={Progress} />
          <Route
            path="/student/evolution"
            component={() => (
              <div className="text-center p-8">
                Evolução Corporal (Em breve)
              </div>
            )}
          />
          <Route
            path="/physical-assessments"
            component={() => <PhysicalAssessments readOnly={true} />}
          />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function Router() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Type assertion do user baseado na estrutura do schema
  const authUser = user as AuthUser;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/student/setup-password" component={StudentSetupPassword} />

      <Route>
        {() => {
          if (!isAuthenticated) {
            return <LoginPage onSuccess={() => window.location.reload()} />;
          }

          // Interface específica para alunos
          if (authUser?.role === "student") {
            return <StudentInterface user={authUser} onLogout={logout} />;
          }

          // Interface completa para professores
          return (
            <div className="flex">
              <Sidebar />
              <main className="flex-1 p-6 bg-gray-50 min-h-screen ml-64">
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/students" component={Students} />
                  <Route path="/workouts" component={Workouts} />
                  <Route
                    path="/physical-assessments"
                    component={() => <PhysicalAssessments />}
                  />
                  <Route path="/progress" component={Progress} />
                  <Route component={NotFound} />
                </Switch>
              </main>
            </div>
          );
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
