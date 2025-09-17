import { Route, Switch } from "wouter";
import StudentSidebar from "./student-sidebar";
import { StudentDashboard } from "@/pages/student-dashboard";
import { StudentWorkouts } from "@/pages/student-workouts";
import { StudentPhysicalAssessments } from "@/pages/student-physical-assessments";
import { StudentProgress } from "@/pages/student-progress";
import { StudentBodyEvolution } from "@/pages/student-body-evolution";
import StudentProfile from "@/pages/student-profile";
import type { Student } from "@shared/schema";

interface StudentLayoutProps {
  student: Student;
  onLogout: () => void;
}

export function StudentLayout({ student, onLogout }: StudentLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <StudentSidebar student={student} onLogout={onLogout} />

      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-6">
          <Switch>
            <Route
              path="/student"
              component={() => (
                <StudentDashboard student={student} onLogout={onLogout} />
              )}
            />
            <Route
              path="/student/workouts"
              component={() => <StudentWorkouts student={student} />}
            />
            <Route
              path="/student/physical-assessments"
              component={() => <StudentPhysicalAssessments student={student} />}
            />
            <Route
              path="/student/progress"
              component={() => <StudentProgress student={student} />}
            />
            <Route
              path="/student/body-evolution"
              component={() => <StudentBodyEvolution student={student} />}
            />
            <Route
              path="/student/profile"
              component={() => <StudentProfile />}
            />
            <Route>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Página não encontrada
                </h2>
                <p className="text-gray-600">
                  A página que você está procurando não existe.
                </p>
              </div>
            </Route>
          </Switch>
        </div>
      </div>
    </div>
  );
}
