import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Hero3DCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Mobile check to optimize performance
    const isMobile = window.innerWidth < 768;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 18;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Geometry: Agronomic botanical lattice / particle nodes
    const particleCount = isMobile ? 80 : 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Palette: soft forest & leaf greens
    const color1 = new THREE.Color('#2E9E5B');
    const color2 = new THREE.Color('#6EE7A0');
    const color3 = new THREE.Color('#14462B');

    for (let i = 0; i < particleCount; i++) {
      // Helix / leaf-vein distribution
      const u = i / particleCount;
      const angle = u * Math.PI * 8;
      const radius = 2.5 + Math.sin(u * Math.PI * 4) * 2.2;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 2;
      const y = (u - 0.5) * 16 + (Math.random() - 0.5) * 1.5;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 2;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixedColor = i % 2 === 0 ? color1.clone().lerp(color2, Math.random()) : color3.clone().lerp(color1, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Material
    const material = new THREE.PointsMaterial({
      size: isMobile ? 0.22 : 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.NormalBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Subtle connecting botanical lines
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x42B870,
      transparent: true,
      opacity: 0.14,
    });
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = [];
    const posArr = geometry.attributes.position.array;
    for (let i = 0; i < particleCount - 1; i += 2) {
      linePositions.push(posArr[i * 3], posArr[i * 3 + 1], posArr[i * 3 + 2]);
      linePositions.push(posArr[(i + 1) * 3], posArr[(i + 1) * 3 + 1], posArr[(i + 1) * 3 + 2]);
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // Interactive mouse coordinates
    let targetX = 0;
    let targetY = 0;
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.4;
      targetY = y * 0.4;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      particles.rotation.y = elapsedTime * 0.12;
      particles.rotation.x = Math.sin(elapsedTime * 0.08) * 0.1;
      lines.rotation.y = particles.rotation.y;
      lines.rotation.x = particles.rotation.x;

      // Smooth camera interpolation towards mouse
      camera.position.x += (targetX * 3 - camera.position.x) * 0.05;
      camera.position.y += (targetY * 3 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div className="hero-3d-canvas-container" ref={mountRef} aria-hidden="true" />;
}
