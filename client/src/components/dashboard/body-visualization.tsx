import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BodyVisualization() {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Evolução Corporal
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedGender === 'male' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedGender('male')}
              data-testid="button-male-body"
            >
              <i className="fas fa-male mr-1"></i> Masculino
            </Button>
            <span className="text-gray-300">|</span>
            <Button
              variant={selectedGender === 'female' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedGender('female')}
              data-testid="button-female-body"
            >
              <i className="fas fa-female mr-1"></i> Feminino
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative flex justify-center items-center h-64">
          <div className="relative">
            {/* Body silhouette placeholder */}
            <div className="w-32 h-48 bg-gray-200 rounded-full mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-gray-300 to-gray-400 opacity-30"></div>
              
              {/* Body parts indicators */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-500 rounded-full opacity-70" title="Cabeça"></div>
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-blue-400 rounded opacity-60" title="Peito"></div>
              <div className="absolute top-20 left-4 w-4 h-8 bg-green-500 rounded opacity-60" title="Braço Esq."></div>
              <div className="absolute top-20 right-4 w-4 h-8 bg-green-500 rounded opacity-60" title="Braço Dir."></div>
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-6 h-8 bg-yellow-500 rounded opacity-60" title="Abdômen"></div>
              <div className="absolute bottom-4 left-6 w-3 h-8 bg-purple-500 rounded opacity-60" title="Perna Esq."></div>
              <div className="absolute bottom-4 right-6 w-3 h-8 bg-purple-500 rounded opacity-60" title="Perna Dir."></div>
            </div>
            
            {/* Interactive overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white bg-opacity-95 rounded-lg p-4 text-center shadow-lg">
                <i className="fas fa-chart-area text-primary text-2xl mb-2"></i>
                <p className="text-sm font-medium text-gray-700">Visualização Interativa</p>
                <p className="text-xs text-gray-500">Clique para ver evolução</p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  data-testid="button-view-evolution"
                >
                  Ver Progresso
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span>Peito/Ombros</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Braços</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span>Abdômen</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
            <span>Pernas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
