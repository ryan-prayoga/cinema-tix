"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { SeatDTO } from "@cinema-tix/shared";

export type PovMode = "seat" | "screen" | "free";

interface Props {
  seats: SeatDTO[];
  mode: PovMode;
  focusId: string;
  selectedIds: Set<string>;
  onFocusSeat: (seat: SeatDTO) => void;
}

const EYE_HEIGHT = 1.05;
const SCREEN_DEPTH = -3;
const SCREEN_Y = 2.6;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function seatColors(seat: SeatDTO, isSelected: boolean, isFocus: boolean) {
  if (isFocus) return { color: "#e8c987", emissive: "#d4a24e", emi: 0.55 };
  if (isSelected) return { color: "#ff3355", emissive: "#c81e3a", emi: 0.8 };
  if (seat.status === "booked") return { color: "#2c2c30", emissive: "#000", emi: 0 };
  if (seat.status === "locked") return { color: "#6b5a2e", emissive: "#000", emi: 0 };
  if (seat.type === "DISABLED")
    return { color: "#1f7a86", emissive: "#0a3a42", emi: 0.25 };
  if (seat.type === "PREMIUM")
    return { color: "#b01d39", emissive: "#5a3a10", emi: 0.3 }; // gold-warm trim
  return { color: "#8e1428", emissive: "#000", emi: 0 }; // velvet red regular
}

// A simple low-poly seated person. variant 'you' = warm/lit, 'other' = dark silhouette.
function Person({ variant }: { variant: "you" | "other" }) {
  const shirt = variant === "you" ? "#e8c987" : "#26262c";
  const skin = variant === "you" ? "#d8a982" : "#1c1c20";
  const emi = variant === "you" ? 0.25 : 0;
  return (
    <group position={[0, 0.33, 0.04]}>
      {/* torso */}
      <mesh position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.17, 0.32, 4, 10]} />
        <meshStandardMaterial color={shirt} emissive={shirt} emissiveIntensity={emi} roughness={0.8} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.66, 0.01]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      {/* lap / thighs */}
      <mesh position={[0, 0.02, 0.2]} rotation={[Math.PI / 2.5, 0, 0]}>
        <capsuleGeometry args={[0.11, 0.26, 4, 8]} />
        <meshStandardMaterial color={shirt} emissive={shirt} emissiveIntensity={emi} roughness={0.8} />
      </mesh>
    </group>
  );
}

function CinemaSeat({
  seat,
  isSelected,
  isFocus,
  occupant,
  onClick,
}: {
  seat: SeatDTO;
  isSelected: boolean;
  isFocus: boolean;
  occupant: "you" | "other" | null;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const c = seatColors(seat, isSelected, isFocus);
  const isPremium = seat.type === "PREMIUM";
  return (
    <group
      position={[seat.x, seat.z, seat.y]}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.62, 0.16, 0.55]} />
        <meshStandardMaterial color={c.color} emissive={c.emissive} emissiveIntensity={c.emi} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.55, 0.26]}>
        <boxGeometry args={[0.62, isPremium ? 0.62 : 0.5, 0.12]} />
        <meshStandardMaterial color={c.color} emissive={c.emissive} emissiveIntensity={c.emi} roughness={0.7} />
      </mesh>
      {/* premium gold headrest trim */}
      {isPremium && !isSelected && !isFocus && (
        <mesh position={[0, 0.85, 0.26]}>
          <boxGeometry args={[0.62, 0.08, 0.13]} />
          <meshStandardMaterial color="#d4a24e" emissive="#d4a24e" emissiveIntensity={0.4} />
        </mesh>
      )}
      <mesh position={[-0.32, 0.38, 0.05]}>
        <boxGeometry args={[0.08, 0.12, 0.5]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.5} />
      </mesh>
      <mesh position={[0.32, 0.38, 0.05]}>
        <boxGeometry args={[0.08, 0.12, 0.5]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.5} />
      </mesh>

      {occupant && <Person variant={occupant} />}
    </group>
  );
}

// Locked first-person look: camera pinned to a position, drag to rotate in place.
function FirstPersonLook({
  position,
  baseYaw,
}: {
  position: THREE.Vector3;
  baseYaw: number;
}) {
  const { camera, gl } = useThree();
  const yaw = useRef(baseYaw);
  const pitch = useRef(0);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  useEffect(() => {
    yaw.current = baseYaw;
    pitch.current = 0;
  }, [baseYaw, position]);

  useEffect(() => {
    const el = gl.domElement;
    const YAW_RANGE = Math.PI / 2.1;
    const PITCH_RANGE = Math.PI / 5;
    const start = (x: number, y: number) =>
      (drag.current = { x, y, yaw: yaw.current, pitch: pitch.current });
    const apply = (x: number, y: number) => {
      if (!drag.current) return;
      yaw.current = clamp(
        drag.current.yaw - (x - drag.current.x) * 0.005,
        baseYaw - YAW_RANGE,
        baseYaw + YAW_RANGE
      );
      pitch.current = clamp(
        drag.current.pitch - (y - drag.current.y) * 0.005,
        -PITCH_RANGE,
        PITCH_RANGE
      );
    };
    const down = (e: PointerEvent) => start(e.clientX, e.clientY);
    const move = (e: PointerEvent) => apply(e.clientX, e.clientY);
    const up = () => (drag.current = null);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl, baseYaw]);

  useFrame(() => {
    camera.position.lerp(position, 0.2);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
  });
  return null;
}

export function SeatViewer3D({ seats, mode, focusId, selectedIds, onFocusSeat }: Props) {
  const focus = useMemo(
    () => seats.find((s) => s.id === focusId) ?? seats[0],
    [seats, focusId]
  );

  const xs = seats.map((s) => s.x);
  const screenWidth = Math.max(...xs) - Math.min(...xs) + 5;
  const maxDepth = Math.max(...seats.map((s) => s.y));

  // Camera target position + facing per mode.
  const seatPos = useMemo(
    () => new THREE.Vector3(focus.x, focus.z + EYE_HEIGHT, focus.y),
    [focus]
  );
  const screenPos = useMemo(
    () => new THREE.Vector3(0, SCREEN_Y + 0.3, SCREEN_DEPTH + 1.2),
    []
  );

  return (
    <Canvas camera={{ fov: 72, position: [focus.x, focus.z + EYE_HEIGHT, focus.y] }}>
      <color attach="background" args={["#050507"]} />
      <fog attach="fog" args={["#050507", 8, 30]} />

      {mode === "seat" && <FirstPersonLook position={seatPos} baseYaw={0} />}
      {mode === "screen" && <FirstPersonLook position={screenPos} baseYaw={Math.PI} />}
      {mode === "free" && (
        <OrbitControls
          makeDefault
          target={[0, 1.4, maxDepth / 2]}
          minDistance={2}
          maxDistance={maxDepth + 12}
          maxPolarAngle={Math.PI / 1.9}
        />
      )}

      <ambientLight intensity={0.25} />
      <pointLight position={[0, SCREEN_Y, SCREEN_DEPTH + 0.5]} intensity={45} color="#cfe0ff" distance={34} />
      <spotLight position={[0, 7, maxDepth * 0.4]} angle={0.7} penumbra={0.8} intensity={25} color="#d4a24e" />

      {/* Screen */}
      <group position={[0, SCREEN_Y, SCREEN_DEPTH]}>
        <mesh>
          <planeGeometry args={[screenWidth, 4.2]} />
          <meshStandardMaterial color="#eaf1ff" emissive="#aac4ff" emissiveIntensity={0.9} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[screenWidth + 0.6, 4.8]} />
          <meshStandardMaterial color="#0a0a0c" />
        </mesh>
      </group>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, maxDepth / 2]}>
        <planeGeometry args={[screenWidth + 6, maxDepth + 8]} />
        <meshStandardMaterial color="#120d0d" roughness={1} />
      </mesh>

      {/* Walls */}
      <mesh position={[-(screenWidth / 2 + 1.5), 3, maxDepth / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[maxDepth + 10, 8]} />
        <meshStandardMaterial color="#0c0a0a" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[screenWidth / 2 + 1.5, 3, maxDepth / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[maxDepth + 10, 8]} />
        <meshStandardMaterial color="#0c0a0a" side={THREE.DoubleSide} />
      </mesh>

      {seats.map((seat) => {
        const isSelected = selectedIds.has(seat.id);
        // Show a person on selected ('you') and booked ('other') seats — but not
        // on the seat you're currently sitting in (first-person POV).
        const occupant: "you" | "other" | null =
          mode === "seat" && seat.id === focusId
            ? null
            : isSelected
              ? "you"
              : seat.status === "booked"
                ? "other"
                : null;
        return (
          <CinemaSeat
            key={seat.id}
            seat={seat}
            isSelected={isSelected}
            isFocus={seat.id === focusId}
            occupant={occupant}
            onClick={(e) => {
              e.stopPropagation();
              if (seat.status === "booked") return;
              onFocusSeat(seat);
            }}
          />
        );
      })}
    </Canvas>
  );
}
