import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ruler, Save, Eye } from "lucide-react";
import BodyAvatar3D from "./body-avatar-3d";

interface BodyMeasurements {
  height?: number;
  weight?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  shoulders?: number;
  arms?: number;
  thighs?: number;
}

interface BodyMeasurementsFormProps {
  initialValues?: BodyMeasurements;
  onSave?: (measurements: BodyMeasurements) => void;
  showPreview?: boolean;
}

export default function BodyMeasurementsForm({
  initialValues = {},
  onSave,
  showPreview = true,
}: BodyMeasurementsFormProps) {
  const [measurements, setMeasurements] =
    useState<BodyMeasurements>(initialValues);
  const [showAvatar, setShowAvatar] = useState(showPreview);

  const handleChange = (field: keyof BodyMeasurements, value: string) => {
    const numValue = parseFloat(value);
    setMeasurements((prev) => ({
      ...prev,
      [field]: isNaN(numValue) ? undefined : numValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(measurements);
    }
  };

  const fields = [
    { key: "height", label: "Altura", unit: "cm", placeholder: "170" },
    { key: "weight", label: "Peso", unit: "kg", placeholder: "70" },
    { key: "chest", label: "Peitoral", unit: "cm", placeholder: "90" },
    { key: "waist", label: "Cintura", unit: "cm", placeholder: "75" },
    { key: "hips", label: "Quadril", unit: "cm", placeholder: "95" },
    { key: "shoulders", label: "Ombros", unit: "cm", placeholder: "40" },
    { key: "arms", label: "Braços", unit: "cm", placeholder: "30" },
    { key: "thighs", label: "Coxas", unit: "cm", placeholder: "55" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Medidas Corporais
          </CardTitle>
          <CardDescription>
            Insira suas medidas para gerar o avatar 3D
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fields.map(({ key, label, unit, placeholder }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <div className="relative">
                    <Input
                      id={key}
                      type="number"
                      step="0.1"
                      placeholder={placeholder}
                      value={measurements[key as keyof BodyMeasurements] || ""}
                      onChange={(e) =>
                        handleChange(
                          key as keyof BodyMeasurements,
                          e.target.value
                        )
                      }
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      {unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              {onSave && (
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Medidas
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAvatar(!showAvatar)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showAvatar ? "Ocultar" : "Visualizar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showAvatar && (
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização do Avatar</CardTitle>
            <CardDescription>
              Visualização 3D baseada nas medidas informadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-gradient-to-b from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg overflow-hidden">
              <BodyAvatar3D measurements={measurements} color="#8b5cf6" />
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full"></span>
                Arraste para rotacionar | Scroll para zoom
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
