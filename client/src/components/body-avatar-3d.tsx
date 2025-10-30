import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useRef, useState, Suspense } from "react";
import * as THREE from "three";

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

interface BodyAvatar3DProps {
  measurements: BodyMeasurements;
  color?: string;
}

function BodyModel({ measurements, color = "#4299e1" }: BodyAvatar3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const height = (measurements.height || 170) / 100;
  const shoulderWidth = (measurements.shoulders || 40) / 100;
  const chestWidth = (measurements.chest || 90) / 200;
  const waistWidth = (measurements.waist || 75) / 200;
  const hipsWidth = (measurements.hips || 95) / 200;
  const armThickness = (measurements.arms || 30) / 200;
  const thighThickness = (measurements.thighs || 55) / 200;

  const headRadius = height * 0.08;
  const neckHeight = height * 0.05;
  const torsoHeight = height * 0.35;
  const upperLegHeight = height * 0.25;
  const lowerLegHeight = height * 0.25;
  const armLength = height * 0.3;

  return (
    <group ref={groupRef}>
      <mesh position={[0, height - headRadius, 0]}>
        <sphereGeometry args={[headRadius, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh position={[0, height - headRadius * 2 - neckHeight / 2, 0]}>
        <cylinderGeometry
          args={[headRadius * 0.4, headRadius * 0.5, neckHeight, 16]}
        />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh
        position={[
          0,
          height - headRadius * 2 - neckHeight - torsoHeight / 2,
          0,
        ]}
      >
        <boxGeometry args={[chestWidth * 2, torsoHeight, chestWidth * 1.5]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh
        position={[
          0,
          height - headRadius * 2 - neckHeight - torsoHeight * 0.65,
          0,
        ]}
      >
        <boxGeometry
          args={[waistWidth * 2, torsoHeight * 0.3, waistWidth * 1.5]}
        />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh
        position={[
          0,
          height -
            headRadius * 2 -
            neckHeight -
            torsoHeight -
            upperLegHeight / 2,
          0,
        ]}
      >
        <boxGeometry
          args={[hipsWidth * 2, upperLegHeight * 0.1, hipsWidth * 1.5]}
        />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh
        position={[
          shoulderWidth / 2 + armThickness,
          height - headRadius * 2 - neckHeight - torsoHeight * 0.15,
          0,
        ]}
      >
        <capsuleGeometry args={[armThickness, armLength, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh
        position={[
          -shoulderWidth / 2 - armThickness,
          height - headRadius * 2 - neckHeight - torsoHeight * 0.15,
          0,
        ]}
      >
        <capsuleGeometry args={[armThickness, armLength, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh
        position={[
          hipsWidth * 0.5,
          height -
            headRadius * 2 -
            neckHeight -
            torsoHeight -
            upperLegHeight / 2,
          0,
        ]}
      >
        <capsuleGeometry args={[thighThickness, upperLegHeight, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh
        position={[
          -hipsWidth * 0.5,
          height -
            headRadius * 2 -
            neckHeight -
            torsoHeight -
            upperLegHeight / 2,
          0,
        ]}
      >
        <capsuleGeometry args={[thighThickness, upperLegHeight, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh
        position={[
          hipsWidth * 0.5,
          height -
            headRadius * 2 -
            neckHeight -
            torsoHeight -
            upperLegHeight -
            lowerLegHeight / 2,
          0,
        ]}
      >
        <capsuleGeometry args={[thighThickness * 0.8, lowerLegHeight, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh
        position={[
          -hipsWidth * 0.5,
          height -
            headRadius * 2 -
            neckHeight -
            torsoHeight -
            upperLegHeight -
            lowerLegHeight / 2,
          0,
        ]}
      >
        <capsuleGeometry args={[thighThickness * 0.8, lowerLegHeight, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

export default function BodyAvatar3D({
  measurements,
  color,
}: BodyAvatar3DProps) {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div
      className="w-full relative"
      style={{ minHeight: "400px", height: "100%" }}
      onMouseDown={() => setAutoRotate(false)}
      onMouseUp={() => setAutoRotate(true)}
      onTouchStart={() => setAutoRotate(false)}
      onTouchEnd={() => setAutoRotate(true)}
    >
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 1, 3]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          <BodyModel measurements={measurements} color={color} />
          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            enableZoom={true}
            enablePan={false}
            minDistance={1.5}
            maxDistance={6}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 4}
          />
          <gridHelper args={[5, 10]} position={[0, 0, 0]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
