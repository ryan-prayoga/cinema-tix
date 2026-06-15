"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Instances, Instance } from "@react-three/drei";
import { useMemo } from "react";
import type { SeatDTO } from "@cinema-tix/shared";

interface Props {
  seats: SeatDTO[];
  // The seat to place the camera at (eye view from this seat toward screen).
  focusSeat: SeatDTO;
}

const EYE_HEIGHT = 1.1; // metres above the seat
const SCREEN_DEPTH = -2; // screen sits in front of row 1 (y grows away from screen)

// Procedural auditorium: instanced seat boxes + a big screen, camera dropped
// into the focused seat looking at the screen centre.
export function SeatViewer3D({ seats, focusSeat }: Props) {
  const others = useMemo(
    () => seats.filter((s) => s.id !== focusSeat.id),
    [seats, focusSeat]
  );

  // Screen width spans the seat block.
  const xs = seats.map((s) => s.x);
  const screenWidth = Math.max(...xs) - Math.min(...xs) + 4;
  const maxY = Math.max(...seats.map((s) => s.y));

  return (
    <Canvas className="h-full w-full">
      <color attach="background" args={["#05060a"]} />
      <PerspectiveCamera
        makeDefault
        fov={75}
        position={[focusSeat.x, focusSeat.z + EYE_HEIGHT, focusSeat.y]}
      />
      <OrbitControls
        target={[0, 1.5, SCREEN_DEPTH]}
        enablePan={false}
        minDistance={0.1}
        maxPolarAngle={Math.PI / 1.8}
        minAzimuthAngle={-Math.PI / 3}
        maxAzimuthAngle={Math.PI / 3}
      />

      <ambientLight intensity={0.4} />
      <pointLight position={[0, 6, 0]} intensity={40} />
      <spotLight position={[0, 5, SCREEN_DEPTH]} intensity={60} angle={0.8} />

      {/* Screen */}
      <mesh position={[0, 2.2, SCREEN_DEPTH]}>
        <planeGeometry args={[screenWidth, 4]} />
        <meshStandardMaterial color="#dfe7ff" emissive="#9fb4ff" emissiveIntensity={0.6} />
      </mesh>

      {/* Floor (tiered overall slab) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, maxY / 2]}>
        <planeGeometry args={[screenWidth + 4, maxY + 6]} />
        <meshStandardMaterial color="#11131a" />
      </mesh>

      {/* Other seats as instances (perf) */}
      <Instances limit={others.length} range={others.length}>
        <boxGeometry args={[0.7, 0.5, 0.7]} />
        <meshStandardMaterial color="#2a2f3d" />
        {others.map((s) => (
          <Instance key={s.id} position={[s.x, s.z + 0.25, s.y]} />
        ))}
      </Instances>

      {/* The focused seat highlighted */}
      <mesh position={[focusSeat.x, focusSeat.z + 0.25, focusSeat.y]}>
        <boxGeometry args={[0.7, 0.5, 0.7]} />
        <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.5} />
      </mesh>
    </Canvas>
  );
}
