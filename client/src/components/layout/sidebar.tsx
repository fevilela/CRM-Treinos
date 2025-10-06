import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { User, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useState } from "react";

interface MenuItem {
  name: string;
  path?: string;
  icon: string;
  submenu?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", path: "/teacher-area", icon: "fas fa-home" },
  { name: "Alunos", path: "/teacher-area/students", icon: "fas fa-users" },
  {
    name: "Treinos",
    path: "/teacher-area/workouts",
    icon: "fas fa-clipboard-list",
  },
  {
    name: "Avaliações",
    icon: "fas fa-clipboard-check",
    submenu: [
      {
        name: "Progresso",
        path: "/teacher-area/assessments",
        icon: "fas fa-chart-line",
      },
      {
        name: "Avaliação Antropométrica",
        path: "/teacher-area/physical-assessments",
        icon: "fas fa-ruler",
      },
      {
        name: "Avaliação Postural",
        path: "/teacher-area/posture-assessments",
        icon: "fas fa-body",
      },
    ],
  },
  {
    name: "Anamnese",
    path: "/teacher-area/anamneses",
    icon: "fas fa-file-medical",
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
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

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

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isSubmenuOpen = (menuName: string) => expandedMenus.includes(menuName);

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.path && location === item.path) return true;
    if (item.submenu) {
      return item.submenu.some((subItem) => subItem.path === location);
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isActive = isMenuActive(item);
    const isOpen = isSubmenuOpen(item.name);

    if (hasSubmenu) {
      return (
        <div key={item.name}>
          <div
            onClick={() => !isCollapsed && toggleSubmenu(item.name)}
            className={`flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-primary transition-colors cursor-pointer ${
              isActive
                ? "border-r-2 border-primary bg-blue-50 text-primary"
                : ""
            } ${isCollapsed ? "justify-center" : ""}`}
            title={isCollapsed ? item.name : ""}
          >
            <div className="flex items-center">
              <i className={`${item.icon} ${isCollapsed ? "" : "mr-3"}`}></i>
              {!isCollapsed && <span>{item.name}</span>}
            </div>
            {!isCollapsed && (
              <span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            )}
          </div>

          {!isCollapsed && isOpen && (
            <div className="bg-gray-50">
              {item.submenu!.map((subItem) => (
                <Link key={subItem.path} href={subItem.path!}>
                  <div
                    className={`flex items-center pl-12 pr-6 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-primary transition-colors cursor-pointer ${
                      location === subItem.path
                        ? "border-r-2 border-primary bg-blue-50 text-primary font-medium"
                        : ""
                    }`}
                  >
                    <i className={`${subItem.icon} mr-3 text-xs`}></i>
                    <span>{subItem.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link key={item.path} href={item.path!}>
        <div
          className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-primary transition-colors cursor-pointer ${
            location === item.path
              ? "border-r-2 border-primary bg-blue-50 text-primary"
              : ""
          } ${isCollapsed ? "justify-center" : ""}`}
          data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
          title={isCollapsed ? item.name : ""}
        >
          <i className={`${item.icon} ${isCollapsed ? "" : "mr-3"}`}></i>
          {!isCollapsed && <span>{item.name}</span>}
        </div>
      </Link>
    );
  };

  return (
    <div
      className={`bg-white shadow-lg fixed h-full z-10 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header com botão de colapsar */}
      <div className="p-6 border-b relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute top-4 right-2 h-8 w-8"
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>

        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "space-x-3"
          }`}
        >
          <div className="bg-primary rounded-lg p-2">
            <i className="fas fa-dumbbell text-white text-xl"></i>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">CRM Treinos</h1>
              <p className="text-sm text-gray-500">MP System</p>
            </div>
          )}
        </div>
      </div>

      <nav
        className="mt-6 overflow-y-auto"
        style={{ height: "calc(100% - 180px)" }}
      >
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>

      {/* User Profile */}
      <div
        className={`absolute bottom-0 p-6 border-t bg-gray-50 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <Link href="/teacher-area/profile">
              <Avatar className="h-10 w-10 cursor-pointer hover:opacity-75">
                <AvatarImage src={user?.profileImageUrl} alt="Foto de perfil" />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              disabled={isLoggingOut}
              data-testid="button-logout"
              className="h-8 w-8"
            >
              <i
                className={`fas ${
                  isLoggingOut ? "fa-spinner fa-spin" : "fa-sign-out-alt"
                }`}
              ></i>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Link href="/teacher-area/profile">
              <div className="flex items-center space-x-3 cursor-pointer hover:opacity-75">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user?.profileImageUrl}
                    alt="Foto de perfil"
                  />
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
        )}
      </div>
    </div>
  );
}

export default Sidebar;
