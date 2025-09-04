import React, { useRef, useState, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BodyMeasurements {
  currentWeight?: number;
  currentHeight?: number;
  bmi?: number;
  chestCirc?: string | number | null;
  waistCirc?: string | number | null;
  hipCirc?: string | number | null;
  rightArmContractedCirc?: string | number | null;
  rightArmRelaxedCirc?: string | number | null;
  leftArmContractedCirc?: string | number | null;
  leftArmRelaxedCirc?: string | number | null;
  rightThighCirc?: string | number | null;
  leftThighCirc?: string | number | null;
  rightCalfCirc?: string | number | null;
  leftCalfCirc?: string | number | null;
  bodyFatPercentage?: string | number | null;
  gender?: string;
}

interface HumanBody3DProps {
  measurements?: BodyMeasurements;
  interactive?: boolean;
  onPartClick?: (partName: string, measurements: any) => void;
}

interface BodyPart {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  measurement?: string | number | null;
  measurementLabel?: string;
}

// Componente individual para uma parte do corpo
function BodyPartMesh({
  part,
  isSelected,
  onPartClick,
  measurements,
}: {
  part: BodyPart;
  isSelected: boolean;
  onPartClick: (name: string) => void;
  measurements?: BodyMeasurements;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.setScalar(1.1);
      } else if (hovered) {
        meshRef.current.scale.setScalar(1.05);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onPartClick(part.name);
  };

  const baseColor = useMemo(() => {
    // Cores mais realistas para pele
    const skinTones = {
      base: "#ffdbac",
      highlight: "#ffecc7",
      selected: "#ff6b6b",
    };

    if (isSelected) return skinTones.selected;
    if (hovered) return skinTones.highlight;
    return skinTones.base;
  }, [isSelected, hovered]);

  return (
    <group position={part.position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={part.size} />
        <meshPhongMaterial
          color={baseColor}
          shininess={30}
          specular={0x222222}
        />
      </mesh>

      {/* Mostrar medição quando selecionado */}
      {isSelected && part.measurement && (
        <Html position={[0, part.size[1] / 2 + 0.3, 0]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
            {part.measurementLabel}:{" "}
            {typeof part.measurement === "number"
              ? part.measurement.toFixed(1)
              : part.measurement}
            cm
          </div>
        </Html>
      )}
    </group>
  );
}

// Modelo 3D do corpo humano
function HumanBodyModel({
  measurements,
  selectedPart,
  onPartClick,
}: {
  measurements?: BodyMeasurements;
  selectedPart: string | null;
  onPartClick: (name: string) => void;
}) {
  const { camera } = useThree();

  // Ajustar a câmera para uma visão melhor
  React.useEffect(() => {
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Definir as partes do corpo com posições e tamanhos realistas
  const bodyParts: BodyPart[] = useMemo(() => {
    const isFemale = measurements?.gender === "female";

    return [
      // Cabeça
      {
        name: "head",
        position: [0, 3.5, 0],
        size: [0.6, 0.8, 0.6],
        color: "#ffdbac",
        measurement: null,
        measurementLabel: "Cabeça",
      },
      // Pescoço
      {
        name: "neck",
        position: [0, 2.9, 0],
        size: [0.3, 0.4, 0.3],
        color: "#ffdbac",
        measurement: null,
        measurementLabel: "Pescoço",
      },
      // Tórax/Peito
      {
        name: "chest",
        position: [0, 2.2, 0],
        size: isFemale ? [1.0, 0.8, 0.6] : [1.2, 0.9, 0.7],
        color: "#ffdbac",
        measurement: measurements?.chestCirc,
        measurementLabel: "Tórax",
      },
      // Cintura
      {
        name: "waist",
        position: [0, 1.2, 0],
        size: isFemale ? [0.8, 0.6, 0.5] : [1.0, 0.7, 0.6],
        color: "#ffdbac",
        measurement: measurements?.waistCirc,
        measurementLabel: "Cintura",
      },
      // Quadril
      {
        name: "hip",
        position: [0, 0.5, 0],
        size: isFemale ? [1.1, 0.7, 0.7] : [1.0, 0.6, 0.6],
        color: "#ffdbac",
        measurement: measurements?.hipCirc,
        measurementLabel: "Quadril",
      },
      // Braço direito superior
      {
        name: "rightUpperArm",
        position: [0.9, 2.0, 0],
        size: [0.25, 0.8, 0.25],
        color: "#ffdbac",
        measurement: measurements?.rightArmContractedCirc,
        measurementLabel: "Braço D (Contraído)",
      },
      // Braço esquerdo superior
      {
        name: "leftUpperArm",
        position: [-0.9, 2.0, 0],
        size: [0.25, 0.8, 0.25],
        color: "#ffdbac",
        measurement: measurements?.leftArmContractedCirc,
        measurementLabel: "Braço E (Contraído)",
      },
      // Braço direito inferior
      {
        name: "rightForearm",
        position: [0.9, 1.0, 0],
        size: [0.2, 0.7, 0.2],
        color: "#ffdbac",
        measurement: null,
        measurementLabel: "Antebraço D",
      },
      // Braço esquerdo inferior
      {
        name: "leftForearm",
        position: [-0.9, 1.0, 0],
        size: [0.2, 0.7, 0.2],
        color: "#ffdbac",
        measurement: null,
        measurementLabel: "Antebraço E",
      },
      // Coxa direita
      {
        name: "rightThigh",
        position: [0.3, -0.5, 0],
        size: [0.35, 1.0, 0.35],
        color: "#ffdbac",
        measurement: measurements?.rightThighCirc,
        measurementLabel: "Coxa D",
      },
      // Coxa esquerda
      {
        name: "leftThigh",
        position: [-0.3, -0.5, 0],
        size: [0.35, 1.0, 0.35],
        color: "#ffdbac",
        measurement: measurements?.leftThighCirc,
        measurementLabel: "Coxa E",
      },
      // Panturrilha direita
      {
        name: "rightCalf",
        position: [0.3, -1.8, 0],
        size: [0.25, 0.8, 0.25],
        color: "#ffdbac",
        measurement: measurements?.rightCalfCirc,
        measurementLabel: "Panturrilha D",
      },
      // Panturrilha esquerda
      {
        name: "leftCalf",
        position: [-0.3, -1.8, 0],
        size: [0.25, 0.8, 0.25],
        color: "#ffdbac",
        measurement: measurements?.leftCalfCirc,
        measurementLabel: "Panturrilha E",
      },
      // Pés
      {
        name: "rightFoot",
        position: [0.3, -2.5, 0.1],
        size: [0.2, 0.1, 0.4],
        color: "#ffdbac",
        measurement: null,
        measurementLabel: "Pé D",
      },
      {
        name: "leftFoot",
        position: [-0.3, -2.5, 0.1],
        size: [0.2, 0.1, 0.4],
        color: "#ffdbac",
        measurement: null,
        measurementLabel: "Pé E",
      },
    ];
  }, [measurements]);

  return (
    <group>
      {/* Iluminação realista */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, 5]} intensity={0.3} />

      {/* Renderizar todas as partes do corpo */}
      {bodyParts.map((part) => (
        <BodyPartMesh
          key={part.name}
          part={part}
          isSelected={selectedPart === part.name}
          onPartClick={onPartClick}
          measurements={measurements}
        />
      ))}

      {/* Plano do chão para sombra */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
    </group>
  );
}

// Componente principal
export default function HumanBody3D({
  measurements,
  interactive = true,
  onPartClick,
}: HumanBody3DProps) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"front" | "back" | "side">("front");

  const handlePartClick = useCallback(
    (partName: string) => {
      if (!interactive) return;

      setSelectedPart(partName === selectedPart ? null : partName);

      if (onPartClick) {
        const part = partName;
        const partMeasurements = {
          chest: measurements?.chestCirc,
          waist: measurements?.waistCirc,
          hip: measurements?.hipCirc,
          rightUpperArm: measurements?.rightArmContractedCirc,
          leftUpperArm: measurements?.leftArmContractedCirc,
          rightThigh: measurements?.rightThighCirc,
          leftThigh: measurements?.leftThighCirc,
          rightCalf: measurements?.rightCalfCirc,
          leftCalf: measurements?.leftCalfCirc,
        };
        onPartClick(partName, partMeasurements);
      }
    },
    [selectedPart, interactive, onPartClick, measurements]
  );

  const formatValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string") {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? value : numValue.toFixed(1);
    }
    return value.toFixed(1);
  };

  const getBMIInfo = (bmi?: number) => {
    if (!bmi) return null;

    if (bmi < 18.5)
      return { category: "Abaixo do peso", color: "bg-blue-100 text-blue-800" };
    if (bmi < 25)
      return { category: "Peso normal", color: "bg-green-100 text-green-800" };
    if (bmi < 30)
      return { category: "Sobrepeso", color: "bg-yellow-100 text-yellow-800" };
    return { category: "Obesidade", color: "bg-red-100 text-red-800" };
  };

  const bmiInfo = getBMIInfo(measurements?.bmi);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Modelo 3D */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Modelo 3D Interativo</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "front" ? "default" : "outline"}
                  onClick={() => setViewMode("front")}
                >
                  Frontal
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "side" ? "default" : "outline"}
                  onClick={() => setViewMode("side")}
                >
                  Lateral
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "back" ? "default" : "outline"}
                  onClick={() => setViewMode("back")}
                >
                  Posterior
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg overflow-hidden">
              <Canvas
                shadows
                camera={{ position: [0, 2, 5], fov: 50 }}
                style={{
                  background: "linear-gradient(to bottom, #f0f9ff, #e0f2fe)",
                }}
              >
                <HumanBodyModel
                  measurements={measurements}
                  selectedPart={selectedPart}
                  onPartClick={handlePartClick}
                />
                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  minDistance={2}
                  maxDistance={10}
                />
              </Canvas>
            </div>
            <div className="mt-4 text-sm text-gray-600 text-center">
              🖱️ Clique nas partes do corpo para ver as medições • 🔄 Arraste
              para rotacionar • 🔍 Scroll para zoom
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de informações */}
      <div className="space-y-6">
        {/* Dados básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados Antropométricos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {measurements?.currentWeight && measurements?.currentHeight && (
              <div className="flex justify-between">
                <span>Peso:</span>
                <span className="font-medium">
                  {formatValue(measurements.currentWeight)} kg
                </span>
              </div>
            )}
            {measurements?.currentHeight && (
              <div className="flex justify-between">
                <span>Altura:</span>
                <span className="font-medium">
                  {formatValue(measurements.currentHeight)} cm
                </span>
              </div>
            )}
            {bmiInfo && (
              <div className="flex justify-between items-center">
                <span>IMC:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {formatValue(measurements?.bmi)}
                  </span>
                  <Badge className={`text-xs ${bmiInfo.color}`}>
                    {bmiInfo.category}
                  </Badge>
                </div>
              </div>
            )}
            {measurements?.bodyFatPercentage && (
              <div className="flex justify-between">
                <span>% Gordura:</span>
                <span className="font-medium">
                  {formatValue(measurements.bodyFatPercentage)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Circunferências */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Circunferências (cm)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {measurements?.chestCirc && (
              <div className="flex justify-between">
                <span>Tórax:</span>
                <span className="font-medium">
                  {formatValue(measurements.chestCirc)}
                </span>
              </div>
            )}
            {measurements?.waistCirc && (
              <div className="flex justify-between">
                <span>Cintura:</span>
                <span className="font-medium">
                  {formatValue(measurements.waistCirc)}
                </span>
              </div>
            )}
            {measurements?.hipCirc && (
              <div className="flex justify-between">
                <span>Quadril:</span>
                <span className="font-medium">
                  {formatValue(measurements.hipCirc)}
                </span>
              </div>
            )}
            {measurements?.rightArmContractedCirc && (
              <div className="flex justify-between">
                <span>Braço D (Cont.):</span>
                <span className="font-medium">
                  {formatValue(measurements.rightArmContractedCirc)}
                </span>
              </div>
            )}
            {measurements?.leftArmContractedCirc && (
              <div className="flex justify-between">
                <span>Braço E (Cont.):</span>
                <span className="font-medium">
                  {formatValue(measurements.leftArmContractedCirc)}
                </span>
              </div>
            )}
            {measurements?.rightThighCirc && (
              <div className="flex justify-between">
                <span>Coxa D:</span>
                <span className="font-medium">
                  {formatValue(measurements.rightThighCirc)}
                </span>
              </div>
            )}
            {measurements?.leftThighCirc && (
              <div className="flex justify-between">
                <span>Coxa E:</span>
                <span className="font-medium">
                  {formatValue(measurements.leftThighCirc)}
                </span>
              </div>
            )}
            {measurements?.rightCalfCirc && (
              <div className="flex justify-between">
                <span>Panturrilha D:</span>
                <span className="font-medium">
                  {formatValue(measurements.rightCalfCirc)}
                </span>
              </div>
            )}
            {measurements?.leftCalfCirc && (
              <div className="flex justify-between">
                <span>Panturrilha E:</span>
                <span className="font-medium">
                  {formatValue(measurements.leftCalfCirc)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parte selecionada */}
        {selectedPart && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">
                Parte Selecionada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-blue-600 mb-2">
                  {selectedPart.charAt(0).toUpperCase() + selectedPart.slice(1)}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPart(null)}
                  className="text-blue-600 border-blue-200"
                >
                  Desselecionar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
