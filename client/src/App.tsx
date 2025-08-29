import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Workouts from "@/pages/workouts";
import PhysicalAssessments from "@/pages/physical-assessments";
import { StudentApp } from "@/pages/student-app";
import StudentSetupPassword from "@/pages/student-setup-password";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Rotas públicas que não precisam de autenticação
  return (
    <Switch>
      <Route path="/student/setup-password" component={StudentSetupPassword} />

      {/* Rotas autenticadas */}
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
            return <LoginPage onSuccess={() => window.location.reload()} />;
          }

          return (
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/students" component={Students} />
              <Route path="/workouts" component={Workouts} />
              <Route
                path="/physical-assessments"
                component={PhysicalAssessments}
              />
              <Route path="/student" component={StudentApp} />
              <Route component={NotFound} />
            </Switch>
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
