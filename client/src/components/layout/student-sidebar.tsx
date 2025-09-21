import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import type { Student } from "@shared/schema";

const studentMenuItems = [
  { name: "Dashboard", path: "/student", icon: "fas fa-home" },
  { name: "Eventos", path: "/student/events", icon: "fas fa-calendar-alt" },
  { name: "Treinos", path: "/student/workouts", icon: "fas fa-clipboard-list" },
  {
    name: "Avaliações Físicas",
    path: "/student/physical-assessments",
    icon: "fas fa-clipboard-check",
  },
  { name: "Progresso", path: "/student/progress", icon: "fas fa-chart-line" },
  {
    name: "Evolução Corporal",
    path: "/student/body-evolution",
    icon: "fas fa-male",
  },
  { name: "Cobranças", path: "/student/debts", icon: "fas fa-credit-card" },
];

interface StudentSidebarProps {
  student: Student;
  onLogout: () => void;
}

export default function StudentSidebar({
  student,
  onLogout,
}: StudentSidebarProps) {
  const [location] = useLocation();

  return (
    <div className="bg-white shadow-lg w-64 fixed h-full z-10">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="bg-primary rounded-lg p-2">
            <i className="fas fa-dumbbell text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CRM Treinos</h1>
            <p className="text-sm text-gray-500">MP System</p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        {studentMenuItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-primary transition-colors cursor-pointer ${
                location === item.path
                  ? "border-r-2 border-primary bg-blue-50 text-primary"
                  : ""
              }`}
              data-testid={`link-${item.name
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              <i className={`${item.icon} mr-3`}></i>
              <span>{item.name}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Student Profile */}
      <div className="absolute bottom-0 w-64 p-6 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <Link href="/student/profile">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-75">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={student.profileImage || undefined}
                  alt="Foto de perfil"
                />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {student.name}
                </p>
                <p className="text-xs text-gray-500">Aluno</p>
              </div>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            data-testid="button-logout"
          >
            <i className="fas fa-sign-out-alt"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
