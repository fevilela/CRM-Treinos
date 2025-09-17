import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { name: "Dashboard", path: "/", icon: "fas fa-home" },
  { name: "Alunos", path: "/students", icon: "fas fa-users" },
  { name: "Treinos", path: "/workouts", icon: "fas fa-clipboard-list" },
  {
    name: "Avaliações Físicas",
    path: "/physical-assessments",
    icon: "fas fa-clipboard-check",
  },
  { name: "Progresso", path: "/progress", icon: "fas fa-chart-line" },
  { name: "Evolução Corporal", path: "/body-evolution", icon: "fas fa-male" },
  { name: "Meu Perfil", path: "/profile", icon: "fas fa-user-circle" },
  { name: "Configurações", path: "/settings", icon: "fas fa-cog" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout, isLoggingOut } = useAuth();

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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <i className="fas fa-user text-white"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Personal Trainer
              </p>
              <p className="text-xs text-gray-500">Sistema CRM</p>
            </div>
          </div>
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
