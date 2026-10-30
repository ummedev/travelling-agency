/* =========================================================
   SkyVoyage — interactive 3D globe (Three.js)
   Dotted sphere + glowing destination pins + animated flight arcs.
   ========================================================= */
(function () {
  "use strict";
  const host = document.getElementById("globe");
  if (!host || typeof THREE === "undefined") return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.z = 3.4;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const globe = new THREE.Group();
  globe.rotation.x = 0.35;
  scene.add(globe);

  // Inner shaded sphere
  globe.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.995, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x0c2240, emissive: 0x061224, shininess: 25, transparent: true, opacity: 0.95 })
  ));

  // Dotted surface (fibonacci sphere)
  const N = 2600;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = Math.PI * (3 - Math.sqrt(5)) * i;
    pos[i * 3] = Math.cos(th) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(th) * r;
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  globe.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: 0x5fb4ff, size: 0.012, transparent: true, opacity: 0.75 })));

  // Atmosphere glow
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.18, 64, 64),
    new THREE.ShaderMaterial({
      vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.18,0.9,0.77,1.0) * i; }",
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    })
  );
  scene.add(glow);

  // Destinations
  const cities = [
    { name: "Paris", lat: 48.85, lon: 2.35 },
    { name: "New York", lat: 40.71, lon: -74.0 },
    { name: "Tokyo", lat: 35.68, lon: 139.69 },
    { name: "Dubai", lat: 25.2, lon: 55.27 },
    { name: "Bali", lat: -8.34, lon: 115.09 },
    { name: "Santorini", lat: 36.39, lon: 25.46 },
    { name: "Cairo", lat: 30.04, lon: 31.24 },
    { name: "Rio", lat: -22.9, lon: -43.17 },
    { name: "Sydney", lat: -33.87, lon: 151.21 },
    { name: "Reykjavik", lat: 64.14, lon: -21.94 },
    { name: "Cape Town", lat: -33.92, lon: 18.42 },
    { name: "Maldives", lat: 3.2, lon: 73.22 },
  ];
  const toVec = (lat, lon, r = 1) => {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  };

  const pinGeo = new THREE.SphereGeometry(0.022, 16, 16);
  const ringGeo = new THREE.RingGeometry(0.03, 0.045, 32);
  const rings = [];
  cities.forEach((c, i) => {
    const p = toVec(c.lat, c.lon, 1.01);
    const pin = new THREE.Mesh(pinGeo, new THREE.MeshBasicMaterial({ color: 0xffb347 }));
    pin.position.copy(p);
    globe.add(pin);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, side: THREE.DoubleSide }));
    ring.position.copy(p);
    ring.lookAt(p.clone().multiplyScalar(2));
    ring.userData.offset = i * 0.4;
    globe.add(ring);
    rings.push(ring);
  });

  // Flight arcs with travelling "planes"
  const routes = [[0, 1], [0, 2], [3, 4], [5, 6], [1, 7], [2, 8], [9, 0], [10, 3], [11, 4], [6, 3], [7, 10]];
  const flights = [];
  routes.forEach(([a, b], i) => {
    const s = toVec(cities[a].lat, cities[a].lon, 1.01);
    const e = toVec(cities[b].lat, cities[b].lon, 1.01);
    const mid = s.clone().add(e).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(1 + s.distanceTo(e) * 0.45);
    const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)),
      new THREE.LineBasicMaterial({ color: i % 2 ? 0x2ee6c5 : 0xff8a65, transparent: true, opacity: 0.55 })
    );
    globe.add(line);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    globe.add(dot);
    flights.push({ curve, dot, t: Math.random(), speed: 0.0025 + Math.random() * 0.003 });
  });

  // Starfield
  const starPos = new Float32Array(900 * 3);
  for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 30;
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.6 }));
  scene.add(stars);

  // Lights
  scene.add(new THREE.AmbientLight(0x6688aa, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(-3, 2, 4);
  scene.add(sun);

  // Drag to spin
  let dragging = false, lastX = 0, lastY = 0, velX = 0.003, velY = 0;
  const down = (x, y) => { dragging = true; lastX = x; lastY = y; };
  const move = (x, y) => {
    if (!dragging) return;
    velX = (x - lastX) * 0.005;
    velY = (y - lastY) * 0.005;
    lastX = x; lastY = y;
  };
  const up = () => { dragging = false; };
  host.addEventListener("mousedown", e => down(e.clientX, e.clientY));
  window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
  window.addEventListener("mouseup", up);
  host.addEventListener("touchstart", e => down(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  host.addEventListener("touchmove", e => move(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  host.addEventListener("touchend", up);

  function resize() {
    const w = host.clientWidth;
    renderer.setSize(w, w);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  // Only render while visible
  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(host);

  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();

    globe.rotation.y += velX;
    globe.rotation.x = Math.max(-1, Math.min(1, globe.rotation.x + velY));
    if (!dragging) {
      velX += (0.003 - velX) * 0.02;
      velY *= 0.9;
    }

    rings.forEach(r => {
      const k = ((t * 0.8 + r.userData.offset) % 1.5) / 1.5;
      r.scale.setScalar(1 + k * 2.5);
      r.material.opacity = 1 - k;
    });
    flights.forEach(f => {
      f.t = (f.t + f.speed) % 1;
      f.dot.position.copy(f.curve.getPoint(f.t));
    });
    stars.rotation.y = t * 0.01;

    renderer.render(scene, camera);
  })();
})();
