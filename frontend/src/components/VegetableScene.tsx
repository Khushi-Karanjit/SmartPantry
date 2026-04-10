import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, DragControls, PerspectiveCamera, Environment, ContactShadows, Image } from '@react-three/drei';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import * as THREE from 'three';

/**
 * UTILITY: Aggressive Fuzzy Chroma Key.
 * Removes white backgrounds with a distance-based tolerance.
 */
function getTransparentDataUrl(url: string, tolerance = 30): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return resolve(url);
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const dist = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
        if (dist < tolerance) {
          data[i + 3] = 0;
        } else if (dist < tolerance + 20) {
          data[i + 3] = ((dist - tolerance) / 20) * 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = () => resolve(url);
  });
}

interface FloatingVegetable3DProps {
  url: string;
  position: [number, number, number];
  scale: number;
  scrollValue: React.MutableRefObject<number>;
  flightVector?: { x: number; y: number };
}

const FloatingVegetable3D = ({ 
  url, 
  position, 
  scale, 
  scrollValue, 
  flightVector = { x: 0, y: 0 } 
}: FloatingVegetable3DProps) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<any>(null);
  const initialY = position[1];
  const initialX = position[0];

  useEffect(() => {
    getTransparentDataUrl(url, 45).then(setDataUrl);
  }, [url]);

  useFrame((state) => {
    if (meshRef.current) {
      // UNIQUE FLIGHT PATH: Shift X and Y based on scroll and flightVector
      const scrollFactor = Math.min(scrollValue.current / 1000, 1);
      meshRef.current.position.y = initialY + (scrollFactor * flightVector.y * 5);
      meshRef.current.position.x = initialX + (scrollFactor * flightVector.x * 5);
      
      // Floating pulse
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      
      // FADE EFFECT
      if (materialRef.current) {
        materialRef.current.opacity = Math.max(0, 1 - (scrollValue.current / 800));
      }
    }
  });

  if (!dataUrl) return null;

  return (
    <group ref={meshRef}>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={1}>
        <Image 
          ref={materialRef}
          url={dataUrl} 
          position={[0, 0, position[2]] as any} 
          scale={scale as any} 
          transparent 
        />
      </Float>
    </group>
  );
};

interface FloatingVegetable2DProps {
  url: string;
  delay?: number;
  initialPos?: { x: string | number; y: string | number };
  scale?: number;
  scrollYProgress: any;
  flightVector?: { x: number; y: number };
}

const FloatingVegetable2D = ({ 
  url, 
  delay = 0, 
  initialPos = { x: 0, y: 0 }, 
  scale = 1, 
  scrollYProgress, 
  flightVector = { x: 0, y: 0 } 
}: FloatingVegetable2DProps) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  // Map scroll progress to a UNIQUE flight path
  const yOffset = useTransform(scrollYProgress, [0, 0.3], [0, flightVector.y * 300 * scale]);
  const xOffset = useTransform(scrollYProgress, [0, 0.3], [0, flightVector.x * 300 * scale]);
  
  const opacityTransform = useTransform(scrollYProgress, [0, 0.2], [0.6, 0]);
  
  const springY = useSpring(yOffset, { stiffness: 40, damping: 15 });
  const springX = useSpring(xOffset, { stiffness: 40, damping: 15 });
  const springOpacity = useSpring(opacityTransform, { stiffness: 40, damping: 15 });

  useEffect(() => {
    getTransparentDataUrl(url, 45).then(setDataUrl);
  }, [url]);

  if (!dataUrl) return null;

  return (
    <motion.img
      src={dataUrl}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        scale: scale,
        rotate: [0, 3, -3, 0]
      }}
      style={{ 
        position: 'absolute', 
        width: 180 * scale,
        left: initialPos.x,
        top: initialPos.y,
        y: springY,
        x: springX,
        opacity: springOpacity,
        pointerEvents: 'none',
        filter: 'blur(1.5px) drop-shadow(0 0 25px rgba(59, 130, 246, 0.2))'
      }}
      transition={{ 
        rotate: { duration: 10, repeat: Infinity, ease: "easeInOut", delay: delay },
        opacity: { duration: 1.5 }
      }}
    />
  );
};

const FallbackGlows = () => (
  <div className="absolute inset-0 z-0 bg-background pointer-events-none">
    <div className="bg-glow">
      <div className="glow-blob blob-1" />
      <div className="glow-blob blob-2" />
    </div>
  </div>
);

export default function VegetableScene() {
  const [hasWebGL, setHasWebGL] = useState(true);
  const { scrollYProgress } = useScroll();
  const scrollValue = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollValue.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    try {
      const canvas = document.createElement('canvas');
      const supported = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      setHasWebGL(supported);
      canvas.addEventListener('webglcontextlost', () => setHasWebGL(false), false);
    } catch {
      setHasWebGL(false);
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // POSITIONS & FLIGHT PATHS
  const vegConfigs = [
    { url: "/assets/tomato.png", pos3d: [-4, 2, -1], pos2d: { x: '15%', y: '15%' }, scale: 1.4, flight: { x: -1, y: 1 } },     // Top Left
    { url: "/assets/broccoli.png", pos3d: [4.5, 2.5, -2], pos2d: { x: '75%', y: '10%' }, scale: 1.6, flight: { x: 1, y: 1 } },  // Top Right
    { url: "/assets/carrot.png", pos3d: [5, -3, -1.5], pos2d: { x: '80%', y: '60%' }, scale: 1.8, flight: { x: 1, y: -1 } },   // Bottom Right
    { url: "/assets/tomato.png", pos3d: [0, -4.5, -2], pos2d: { x: '45%', y: '80%' }, scale: 1.1, flight: { x: 0, y: -1 } },    // Bottom
    { url: "/assets/carrot.png", pos3d: [-6.5, -2, -3], pos2d: { x: '10%', y: '45%' }, scale: 1.3, flight: { x: -1, y: 0 } },   // Left
  ];

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      <FallbackGlows />
      
      {hasWebGL ? (
        <Canvas shadows dpr={[1, 2]} className="w-full h-full pointer-events-auto">
          <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
          <ambientLight intensity={1.5} />
          <Suspense fallback={null}>
            <DragControls>
              {vegConfigs.map((v, i) => (
                <FloatingVegetable3D key={i} url={v.url} position={v.pos3d as [number, number, number]} scale={v.scale * 1.5} scrollValue={scrollValue} flightVector={v.flight} />
              ))}
            </DragControls>
            <Environment preset="city" />
            <ContactShadows position={[0, -5, 0]} scale={25} blur={3} far={5} opacity={0.2} />
          </Suspense>
        </Canvas>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center opacity-40">
           {vegConfigs.map((v, i) => (
             <FloatingVegetable2D key={i} url={v.url} initialPos={v.pos2d as any} scale={v.scale} delay={i * 0.5} scrollYProgress={scrollYProgress} flightVector={v.flight as any} />
           ))}
        </div>
      )}
    </div>
  );
}
