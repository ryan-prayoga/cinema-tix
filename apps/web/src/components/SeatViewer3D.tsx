"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { SeatDTO } from "@cinema-tix/shared";

interface Props {
  seats: SeatDTO[];
  focusId: string;
  selectedIds: Set<string>;
  // Clicking a seat in the scene hops the POV there.
  onFocusSeat: (seat: SeatDTO) => void;
}

const EYE_HEIGHT = 1.05;
const SCREEN_DEPTH = -3;
const SCREEN_Y = 2.6;

// Colors per seat state.
function seatColors(seat: SeatDTO, isSelected: boolean, isFocus: boolean) {
  if (isFocus) return { color: "#e8c987", emissive: "#d4a24e", emi: 0.5 };
  if (isSelected) return { color: "#ff3355", emissive: "#c81e3a", emi: 0.8 };
  if (seat.status === "booked") return { color: "#2c2c30", emissive: "#000", emi: 0 };
  if (seat.status === "locked") return { color: "#6b5a2e", emissive: "#000", emi: 0 };
  if (seat.type === "PREMIUM")
    return { color: "#b01d39", emissive: "#3a0a14", emi: 0.15 };
  return { color: "#8e1428", emissive: "#000", emi: 0 }; // velvet red
}

// A single low-poly cinema chair: seat base, backrest, two armrests.
function CinemaSeat({
  seat,
  isSelected,
  isFocus,
  onClick,
}: {
  seat: SeatDTO;
  isSelected: boolean;
  isFocus: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const c = seatColors(seat, isSelected, isFocus);
  const px = seat.x;
  const pz = seat.y; // depth
  const py = seat.z; // tier height

  return (
    <group
      position={[px, py, pz]}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      {/* seat base */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.62, 0.16, 0.55]} />
        <meshStandardMaterial color={c.color} emissive={c.emissive} emissiveIntensity={c.emi} roughness={0.7} />
      </mesh>
      {/* backrest */}
      <mesh position={[0, 0.55, 0.26]}>
        <boxGeometry args={[0.62, 0.5, 0.12]} />
        <meshStandardMaterial color={c.color} emissive={c.emissive} emissiveIntensity={c.emi} roughness={0.7} />
      </mesh>
      {/* armrests */}
      <mesh position={[-0.32, 0.38, 0.05]}>
        <boxGeometry args={[0.08, 0.12, 0.5]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.5} />
      </mesh>
      <mesh position={[0.32, 0.38, 0.05]}>
        <boxGeometry args={[0.08, 0.12, 0.5]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.5} />
      </mesh>
    </group>
  );
}

// Moves the camera to the focused seat's eye position, smoothly, while keeping
// OrbitControls free for looking around (transition flag stops the fight).
function Rig({ focus }: { focus: SeatDTO }) {
  const { camera, controls } = useThree() as any;
  const desired = useRef(new THREE.Vector3());
  const transitioning = useRef(true);

  useEffect(() => {
    desired.current.set(focus.x, focus.z + EYE_HEIGHT, focus.y);
    transitioning.current = true;
  }, [focus]);

  useFrame(() => {
    if (transitioning.current) {
      camera.position.lerp(desired.current, 0.15);
      if (controls) {
        controls.target.set(0, SCREEN_Y - 0.6, SCREEN_DEPTH);
        controls.update();
      }
      if (camera.position.distanceTo(desired.current) < 0.02) {
        transitioning.current = false;
      }
    }
  });
  return null;
}

export function SeatViewer3D({ seats, focusId, selectedIds, onFocusSeat }: Props) {
  const focus = useMemo(
    () => seats.find((s) => s.id === focusId) ?? seats[0],
    [seats, focusId]
  );

  const xs = seats.map((s) => s.x);
  const screenWidth = Math.max(...xs) - Math.min(...xs) + 5;
  const maxDepth = Math.max(...seats.map((s) => s.y));

  return (
    <Canvas shadows camera={{ fov: 72, position: [focus.x, focus.z + EYE_HEIGHT, focus.y] }}>
      <color attach="background" args={["#050507"]} />
      <fog attach="fog" args={["#050507", 8, 26]} />

      <Rig focus={focus} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.9}
        minAzimuthAngle={-Math.PI / 2.4}
        maxAzimuthAngle={Math.PI / 2.4}
        rotateSpeed={-0.4}
      />

      <ambientLight intensity={0.25} />
      {/* screen glow as key light */}
      <pointLight position={[0, SCREEN_Y, SCREEN_DEPTH + 0.5]} intensity={45} color="#cfe0ff" distance={30} />
      <spotLight position={[0, 7, maxDepth * 0.4]} angle={0.7} penumbra={0.8} intensity={25} color="#d4a24e" />

      {/* Curved-ish glowing screen */}
      <group position={[0, SCREEN_Y, SCREEN_DEPTH]}>
        <mesh>
          <planeGeometry args={[screenWidth, 4.2]} />
          <meshStandardMaterial
            color="#eaf1ff"
            emissive="#aac4ff"
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
        {/* screen frame */}
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[screenWidth + 0.6, 4.8]} />
          <meshStandardMaterial color="#0a0a0c" />
        </mesh>
      </group>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, maxDepth / 2]} receiveShadow>
        <planeGeometry args={[screenWidth + 6, maxDepth + 8]} />
        <meshStandardMaterial color="#120d0d" roughness={1} />
      </mesh>

      {/* Side walls for enclosure */}
      <mesh position={[-(screenWidth / 2 + 1.5), 3, maxDepth / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[maxDepth + 10, 8]} />
        <meshStandardMaterial color="#0c0a0a" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[screenWidth / 2 + 1.5, 3, maxDepth / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[maxDepth + 10, 8]} />
        <meshStandardMaterial color="#0c0a0a" side={THREE.DoubleSide} />
      </mesh>

      {/* Seats */}
      {seats.map((seat) => (
        <CinemaSeat
          key={seat.id}
          seat={seat}
          isSelected={selectedIds.has(seat.id)}
          isFocus={seat.id === focusId}
          onClick={(e) => {
            e.stopPropagation();
            if (seat.status === "booked") return;
            onFocusSeat(seat);
          }}
        />
      ))}
    </Canvas>
  );
}
