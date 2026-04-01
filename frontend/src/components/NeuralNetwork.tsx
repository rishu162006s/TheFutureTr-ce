"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ── Glowing particle nodes ── */
function Nodes({ count = 120 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const nodes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        speed: 0.2 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2,
        scale: 0.04 + Math.random() * 0.08,
      });
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    nodes.forEach((n, i) => {
      const pulse = 1 + 0.3 * Math.sin(t * n.speed + n.offset);
      dummy.position.set(n.x, n.y + Math.sin(t * 0.3 + n.offset) * 0.3, n.z);
      dummy.scale.setScalar(n.scale * pulse);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#818cf8" transparent opacity={0.85} />
    </instancedMesh>
  );
}

/* ── Animated connection lines ── */
function Connections({ nodeCount = 120 }: { nodeCount?: number }) {
  const linesRef = useRef<THREE.LineSegments>(null!);

  const { positions, colors } = useMemo(() => {
    const rng: Array<{ x: number; y: number; z: number }> = [];
    for (let i = 0; i < nodeCount; i++) {
      const r = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      rng.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) });
    }

    const pos: number[] = [];
    const col: number[] = [];
    const maxDist = 5;
    const palette = [
      new THREE.Color("#6366f1"),
      new THREE.Color("#8b5cf6"),
      new THREE.Color("#06b6d4"),
      new THREE.Color("#10b981"),
    ];

    rng.forEach((a, i) => {
      rng.forEach((b, j) => {
        if (j <= i) return;
        const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
        if (d < maxDist) {
          pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
          const c = palette[Math.floor(Math.random() * palette.length)];
          const alpha = 1 - d / maxDist;
          col.push(c.r * alpha, c.g * alpha, c.b * alpha, c.r * alpha * 0.3, c.g * alpha * 0.3, c.b * alpha * 0.3);
        }
      });
    });

    return { positions: new Float32Array(pos), colors: new Float32Array(col) };
  }, [nodeCount]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.15;
    if (linesRef.current) {
      linesRef.current.rotation.y = t;
      linesRef.current.rotation.x = Math.sin(t * 0.4) * 0.2;
    }
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.6} />
    </lineSegments>
  );
}

/* ── Floating particles field ── */
function ParticleField({ count = 2000 }: { count?: number }) {
  const ptsRef = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (ptsRef.current) {
      ptsRef.current.rotation.y = clock.getElapsedTime() * 0.03;
      ptsRef.current.rotation.x = clock.getElapsedTime() * 0.015;
    }
  });

  return (
    <points ref={ptsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#6366f1" size={0.04} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

/* ── Mouse parallax camera ── */
function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    camera.position.x += (mouse.current.x * 1.5 - camera.position.x) * 0.04;
    camera.position.y += (mouse.current.y * 1.0 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function NeuralNetwork() {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 18], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <CameraRig />
        <ambientLight intensity={0.2} />
        <ParticleField count={1800} />
        <Connections nodeCount={90} />
        <Nodes count={90} />
      </Canvas>
    </div>
  );
}
