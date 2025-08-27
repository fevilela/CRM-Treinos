import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
            {title}
          </h2>
          <p className="text-gray-600 mt-1" data-testid="text-page-subtitle">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button 
            className="relative p-2 text-gray-600 hover:text-primary transition-colors"
            data-testid="button-notifications"
          >
            <i className="fas fa-bell text-lg"></i>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>
          {actions}
        </div>
      </div>
    </header>
  );
}
