import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface AreaSelectionProps {
  userRole?: "teacher" | "student";
  onLogout: () => void;
}

export default function AreaSelection({
  userRole,
  onLogout,
}: AreaSelectionProps) {
  const [, setLocation] = useLocation();

  const handleTeacherAreaAccess = () => {
    setLocation("/teacher-area");
  };

  const handleStudentAreaAccess = () => {
    setLocation("/student-area");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-lg p-3">
              <i className="fas fa-dumbbell text-white text-2xl"></i>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            CRM Treinos MP
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Escolha a área que deseja acessar
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full h-16 text-lg"
            onClick={handleTeacherAreaAccess}
            data-testid="button-teacher-area"
          >
            <div className="flex items-center justify-center space-x-3">
              <i className="fas fa-chalkboard-teacher text-xl"></i>
              <div>
                <div className="font-semibold">Área do Professor</div>
                <div className="text-sm opacity-90">
                  Gerenciar alunos, treinos e acompanhamento
                </div>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-16 text-lg"
            onClick={handleStudentAreaAccess}
            data-testid="button-student-area"
          >
            <div className="flex items-center justify-center space-x-3">
              <i className="fas fa-user-graduate text-xl"></i>
              <div>
                <div className="font-semibold">Área do Aluno</div>
                <div className="text-sm opacity-90">
                  Acessar treinos e acompanhar progresso
                </div>
              </div>
            </div>
          </Button>

          {userRole && (
            <div className="text-center text-sm text-gray-600 mt-4">
              Você está logado como:{" "}
              <strong>{userRole === "teacher" ? "Professor" : "Aluno"}</strong>
            </div>
          )}

          <div className="text-center mt-4">
            <Button
              variant="link"
              onClick={onLogout}
              className="text-sm text-gray-600"
              data-testid="button-logout"
            >
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
