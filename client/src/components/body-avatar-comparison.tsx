import { useState } from "react";
import BodyAvatar3D from "./body-avatar-3d";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react";

interface BodyMeasurements {
  height?: number;
  weight?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  shoulders?: number;
  arms?: number;
  thighs?: number;
  date?: string;
}

interface BodyAvatarComparisonProps {
  beforeMeasurements: BodyMeasurements;
  afterMeasurements: BodyMeasurements;
}

export default function BodyAvatarComparison({
  beforeMeasurements,
  afterMeasurements,
}: BodyAvatarComparisonProps) {
  const calculateDifference = (before?: number, after?: number) => {
    if (!before || !after) return null;
    const diff = after - before;
    return {
      value: Math.abs(diff),
      type: diff > 0 ? "increase" : diff < 0 ? "decrease" : "same",
      percentage: ((Math.abs(diff) / before) * 100).toFixed(1),
    };
  };

  const measurements = [
    { key: "weight", label: "Peso", unit: "kg" },
    { key: "chest", label: "Peitoral", unit: "cm" },
    { key: "waist", label: "Cintura", unit: "cm" },
    { key: "hips", label: "Quadril", unit: "cm" },
    { key: "shoulders", label: "Ombros", unit: "cm" },
    { key: "arms", label: "Braços", unit: "cm" },
    { key: "thighs", label: "Coxas", unit: "cm" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Antes</CardTitle>
              {beforeMeasurements.date && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(beforeMeasurements.date).toLocaleDateString()}
                </Badge>
              )}
            </div>
            <CardDescription>Medidas iniciais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg overflow-hidden">
              <BodyAvatar3D measurements={beforeMeasurements} color="#3b82f6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Depois</CardTitle>
              {afterMeasurements.date && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(afterMeasurements.date).toLocaleDateString()}
                </Badge>
              )}
            </div>
            <CardDescription>Medidas atuais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg overflow-hidden">
              <BodyAvatar3D measurements={afterMeasurements} color="#10b981" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparação de Medidas</CardTitle>
          <CardDescription>
            Diferenças entre as medidas inicial e atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {measurements.map(({ key, label, unit }) => {
              const before = beforeMeasurements[
                key as keyof BodyMeasurements
              ] as number | undefined;
              const after = afterMeasurements[key as keyof BodyMeasurements] as
                | number
                | undefined;
              const diff = calculateDifference(before, after);

              return (
                <div
                  key={key}
                  className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
                >
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {label}
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {after || "-"}
                    </span>
                    <span className="text-sm text-gray-500">{unit}</span>
                  </div>
                  {diff && diff.type !== "same" && (
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        diff.type === "increase"
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {diff.type === "increase" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {diff.type === "increase" ? "+" : "-"}
                        {diff.value} {unit} ({diff.percentage}%)
                      </span>
                    </div>
                  )}
                  {before && (
                    <div className="text-xs text-gray-500 mt-1">
                      Antes: {before} {unit}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
