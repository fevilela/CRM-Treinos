import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/teacher-area", icon: "fas fa-home" },
  { name: "Alunos", path: "/teacher-area/students", icon: "fas fa-users" },
  {
    name: "Treinos",
    path: "/teacher-area/workouts",
    icon: "fas fa-clipboard-list",
  },
  {
    name: "Avaliações Físicas",
    path: "/teacher-area/physical-assessments",
    icon: "fas fa-clipboard-check",
  },
  {
    name: "Avaliação Postural",
    path: "/teacher-area/posture-assessments",
    icon: "fas fa-body",
  },
  {
    name: "Progresso",
    path: "/teacher-area/progress",
    icon: "fas fa-chart-line",
  },
  {
    name: "Evolução Corporal",
    path: "/teacher-area/body-evolution",
    icon: "fas fa-male",
  },
  {
    name: "Finanças",
    path: "/teacher-area/finances",
    icon: "fas fa-dollar-sign",
  },
  { name: "Configurações", path: "/teacher-area/settings", icon: "fas fa-cog" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout, isLoggingOut } = useAuth();

  // Buscar dados do usuário atual
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

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
        {menuItems.map((item) => (
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

      {/* User Profile */}
      <div className="absolute bottom-0 w-64 p-6 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <Link href="/teacher-area/profile">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-75">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profileImageUrl} alt="Foto de perfil" />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">Personal Trainer</p>
              </div>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            disabled={isLoggingOut}
            data-testid="button-logout"
          >
            <i
              className={`fas ${
                isLoggingOut ? "fa-spinner fa-spin" : "fa-sign-out-alt"
              }`}
            ></i>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
