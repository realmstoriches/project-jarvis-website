// react-app/src/components/NeuralNetwork.tsx - FINAL CORRECTED VERSION

import React, { useMemo, useRef, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { AIState } from '../types';

const PARTICLE_COUNT = 5000;
const NETWORK_RADIUS = 20;

const createParticleSystem = (count: number, color: THREE.Color, size: number) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = NETWORK_RADIUS * Math.cbrt(Math.random());
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.7 });
  return new THREE.Points(geometry, material);
};

interface NeuralNetworkProps {
  aiState: AIState;
  children: ReactNode;
}

export const NeuralNetwork: React.FC<NeuralNetworkProps> = ({ aiState, children }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const ambientParticlesRef = useRef<THREE.Points>(null);
  const thinkingParticlesRef = useRef<THREE.Points>(null);
  const listeningParticlesRef = useRef<THREE.Points>(null);

  const colors = useMemo(() => ({
    idle: new THREE.Color('#0077ff'),
    listening: new THREE.Color('#00ffff'),
    thinking: new THREE.Color('#ff00ff'),
    speaking: new THREE.Color('#00aaff'),
  }), []);

  const ambientParticles = useMemo(() => createParticleSystem(PARTICLE_COUNT, new THREE.Color('#ffffff'), 0.02), []);
  const thinkingParticles = useMemo(() => createParticleSystem(1000, colors.thinking, 0.05), [colors.thinking]);
  const listeningParticles = useMemo(() => createParticleSystem(500, colors.listening, 0.04), [colors.listening]);

  useFrame((state, delta) => {
    // LINTING FIX: The 'time' constant was unused and has been removed.
    if (coreRef.current) {
      const targetColor = colors[aiState];
      (coreRef.current.material as THREE.MeshStandardMaterial).color.lerp(targetColor, delta * 5);
      const scaleFactor = aiState === 'listening' ? 1.5 : aiState === 'thinking' ? 1.8 : 1.0;
      coreRef.current.scale.lerp(new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor), delta * 5);
      coreRef.current.rotation.y += delta * 0.1;
    }

    if (ambientParticlesRef.current) {
      ambientParticlesRef.current.rotation.y += delta * 0.05;
    }

    if (thinkingParticlesRef.current) {
        thinkingParticlesRef.current.visible = aiState === 'thinking';
        if (aiState === 'thinking') {
            thinkingParticlesRef.current.rotation.y -= delta * 0.5;
            thinkingParticlesRef.current.rotation.x += delta * 0.3;
        }
    }
    if (listeningParticlesRef.current) {
        // CORRECTED: This was a typo, changed from 'ai.state' to 'aiState'
        listeningParticlesRef.current.visible = aiState === 'listening';
         if (aiState === 'listening') {
            listeningParticlesRef.current.rotation.y += delta * 0.2;
        }
    }
  });
  
  const [chatNode, dashboardNode] = React.Children.toArray(children);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enableZoom={true} enablePan={true} minDistance={5} maxDistance={40} />
      
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={colors.idle} emissive={colors.idle} emissiveIntensity={0.5} wireframe={true} />
      </mesh>

      <points ref={ambientParticlesRef} {...{geometry: ambientParticles.geometry, material: ambientParticles.material}} />
      <points ref={thinkingParticlesRef} {...{geometry: thinkingParticles.geometry, material: thinkingParticles.material}} visible={false} />
      <points ref={listeningParticlesRef} {...{geometry: listeningParticles.geometry, material: listeningParticles.material}} visible={false} />

      <Html position={[-5, 0, 0]} transform occlude distanceFactor={10}>
          <div className="w-[400px] h-[500px]">
             {chatNode}
          </div>
      </Html>

      <Html position={[5, 0, 0]} transform occlude distanceFactor={10}>
          <div className="w-[400px] h-[500px]">
            {dashboardNode}
          </div>
      </Html>
    </>
  );
};