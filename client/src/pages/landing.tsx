import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
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
            Sistema completo de gerenciamento para personal trainers
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <ul className="space-y-2">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Gerenciamento completo de alunos
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Criação de fichas de treino personalizadas
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Acompanhamento de progresso
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Visualização de evolução corporal
                </li>
              </ul>
            </div>
            <Button
              className="w-full"
              onClick={() => (window.location.href = "/api/login")}
              data-testid="button-login"
            >
              Entrar como Professor
            </Button>
            <div className="text-center text-sm text-gray-600 mt-2">
              Alunos: acesse através do link enviado por email
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
