/* Lazy, optional Three.js enhancement. The CSS sculpture remains if WebGL fails. */
const stage = document.querySelector('#hero-art');
const mount = document.querySelector('#scene-mount');
let enabled = document.documentElement.dataset.motion !== 'off';
let visible = true;
let disposed = false;
let frame = 0;
let renderer;
let threeReady = false;
let exploded = stage.classList.contains('is-exploded');
let dirty = true;
const pointer = { x: 0, y: 0 };
const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) dirty = true; }, { rootMargin: '100px' });
observer.observe(stage);
window.addEventListener('portfolio:motion', event => { enabled = event.detail.enabled; dirty = true; });
window.addEventListener('portfolio:structure', event => { exploded = event.detail.exploded; dirty = true; });
stage.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || !enabled) return;
  const rect = stage.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
}, { passive: true });
stage.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });

async function initialize() {
  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
    if (disposed) return;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.3 : 1.7));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    camera.position.set(4.6, 3.8, 6.6);
    camera.lookAt(0, 0, 0);
    const group = new THREE.Group();
    group.rotation.y = -0.36;
    group.rotation.z = -0.10;
    scene.add(group);
    // A small, locally generated studio environment; no downloaded 3D assets.
    const environmentCanvas = document.createElement('canvas');
    environmentCanvas.width = 512; environmentCanvas.height = 256;
    const ctx = environmentCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#fafbff'); gradient.addColorStop(0.4, '#c8d5ff'); gradient.addColorStop(0.54, '#24306f'); gradient.addColorStop(0.7, '#819cd9'); gradient.addColorStop(1, '#dee5f2');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(90, 5, 28, 115); ctx.fillRect(340, 5, 65, 105);
    const environment = new THREE.CanvasTexture(environmentCanvas);
    environment.mapping = THREE.EquirectangularReflectionMapping;
    environment.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromEquirectangular(environment);
    scene.environment = envTarget.texture;
    environment.dispose(); pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xe9edff, 0x273473, 2.7));
    const key = new THREE.DirectionalLight(0xffffff, 4.7); key.position.set(-3, 6, 4); scene.add(key);
    const fill = new THREE.DirectionalLight(0x6284ff, 3); fill.position.set(4, 2, -2); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 2); rim.position.set(-4, -1, -4); scene.add(rim);
    const shape = new THREE.Shape();
    const w = 2.6, h = 1.75, r = 0.19;
    shape.moveTo(-w/2+r, -h/2); shape.lineTo(w/2-r, -h/2); shape.quadraticCurveTo(w/2, -h/2, w/2, -h/2+r);
    shape.lineTo(w/2, h/2-r); shape.quadraticCurveTo(w/2, h/2, w/2-r, h/2); shape.lineTo(-w/2+r, h/2);
    shape.quadraticCurveTo(-w/2, h/2, -w/2, h/2-r); shape.lineTo(-w/2, -h/2+r); shape.quadraticCurveTo(-w/2, -h/2, -w/2+r, -h/2);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.078, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.024, bevelThickness: 0.024, curveSegments: 8 });
    geometry.center(); geometry.rotateX(-Math.PI / 2);
    const materials = [];
    const plates = [];
    for (let i = 0; i < 9; i++) {
      const material = new THREE.MeshPhysicalMaterial({ color: i === 8 ? 0x93b0ff : 0x304bea, metalness: 0.68, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.2, envMapIntensity: 1.45 });
      materials.push(material);
      const plate = new THREE.Mesh(geometry, material);
      plate.position.y = (i - 4) * 0.255;
      plate.rotation.y = (i - 4) * 0.07;
      group.add(plate); plates.push(plate);
    }
    const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
    const sc = shadowCanvas.getContext('2d'); const sg = sc.createRadialGradient(64,64,1,64,64,64);
    sg.addColorStop(0, 'rgba(27,40,98,.22)'); sg.addColorStop(1, 'rgba(27,40,98,0)'); sc.fillStyle = sg; sc.fillRect(0,0,128,128);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
    const shadowGeometry = new THREE.PlaneGeometry(5, 3.7);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial); shadow.rotation.x = -Math.PI/2; shadow.position.y = -1.67; scene.add(shadow);
    function resize() {
      const width = stage.clientWidth, height = stage.clientHeight;
      if (!width || !height || disposed) return;
      camera.aspect = width / height;
      camera.position.set(4.6, 3.8, 6.6);
      if (width < 430) camera.position.multiplyScalar(1.14);
      camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
      dirty = true;
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(stage); resize();
    let lastTime = 0, time = 0, spread = 0;
    function render(now) {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      if (!visible || document.hidden) { lastTime = now; return; }
      const elapsed = Math.min((now - lastTime) / 1000, 0.06);
      if (elapsed < 1 / (innerWidth < 760 ? 30 : 45)) return;
      lastTime = now;
      if (!enabled && !dirty && threeReady) return;
      if (enabled) time += elapsed;
      const smoothing = enabled ? 1 - Math.exp(-elapsed * 4.5) : 1;
      spread += ((exploded ? 1 : 0) - spread) * smoothing;
      group.rotation.y += ((-0.36 + (enabled ? Math.sin(time * 0.3) * 0.14 + pointer.x * 0.17 : 0)) - group.rotation.y) * smoothing;
      group.rotation.x += (((enabled ? pointer.y * 0.11 : 0)) - group.rotation.x) * smoothing;
      group.position.y = enabled ? Math.sin(time * 0.65) * 0.055 : 0;
      group.scale.setScalar(1 - spread * 0.08);
      plates.forEach((plate, i) => { plate.position.y = (i - 4) * (0.255 + spread * 0.13); plate.rotation.y = (i - 4) * (0.07 + spread * 0.07) + (enabled ? Math.sin(time * 0.35 + i * 0.16) * 0.025 : 0); });
      renderer.render(scene, camera);
      dirty = false;
      if (!threeReady) { stage.classList.add('scene-ready'); threeReady = true; if (window.portfolioState) window.portfolioState.scene = 'webgl'; }
    }
    frame = requestAnimationFrame(render);
    renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(frame); stage.classList.remove('scene-ready'); if (window.portfolioState) window.portfolioState.scene = 'fallback'; });
    function dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect();
      geometry.dispose(); materials.forEach(m => m.dispose()); shadowGeometry.dispose(); shadowMaterial.dispose(); shadowTexture.dispose(); envTarget.dispose(); renderer.dispose();
    }
    window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
  } catch (_) {
    if (renderer) renderer.dispose();
    mount.replaceChildren(); stage.classList.remove('scene-ready');
    if (window.portfolioState) window.portfolioState.scene = 'fallback';
  }
}
if ('requestIdleCallback' in window) requestIdleCallback(initialize, { timeout: 1600 }); else setTimeout(initialize, 200);
