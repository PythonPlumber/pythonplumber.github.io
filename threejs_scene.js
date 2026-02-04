import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const container = document.getElementById('threejs-container');
const sizes = {
  width: container.clientWidth || window.innerWidth,
  height: container.clientHeight || window.innerHeight * 0.6
};

const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 1.6, 5);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envTexture;

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 0.7, 0.4, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 0.7;
bloomPass.radius = 0.2;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

const ambientLight = new THREE.AmbientLight(0x1a1a1a, 0.6);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0x88ff88, 1.2);
mainLight.position.set(4, 8, 2);
mainLight.castShadow = true;
mainLight.shadow.mapSize.set(1024, 1024);
mainLight.shadow.camera.near = 1;
mainLight.shadow.camera.far = 20;
scene.add(mainLight);

const fillLight = new THREE.PointLight(0x00ff88, 0.4, 20);
fillLight.position.set(-3, 2, -4);
scene.add(fillLight);

const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x020402,
  metalness: 0.6,
  roughness: 0.4
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.2;
ground.receiveShadow = true;
scene.add(ground);

const coreGeometry = new THREE.SphereGeometry(1.1, 64, 64);
const coreMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x00ff88,
  emissive: 0x003322,
  emissiveIntensity: 1,
  metalness: 0.9,
  roughness: 0.15,
  clearcoat: 1,
  clearcoatRoughness: 0.1
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
core.castShadow = true;
core.receiveShadow = true;
scene.add(core);

const ringGeometry = new THREE.TorusGeometry(1.6, 0.06, 32, 128);
const ringMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ff88,
  emissive: 0x005533,
  emissiveIntensity: 0.6,
  metalness: 0.95,
  roughness: 0.25
});
const ring = new THREE.Mesh(ringGeometry, ringMaterial);
ring.rotation.x = Math.PI / 2.8;
ring.castShadow = true;
scene.add(ring);

const lod = new THREE.LOD();

const highDetailGeom = new THREE.IcosahedronGeometry(0.3, 3);
const midDetailGeom = new THREE.IcosahedronGeometry(0.3, 1);
const lowDetailGeom = new THREE.IcosahedronGeometry(0.3, 0);

const lodMaterial = new THREE.MeshStandardMaterial({
  color: 0x66ffbb,
  metalness: 0.8,
  roughness: 0.3
});

const lodHigh = new THREE.Mesh(highDetailGeom, lodMaterial);
const lodMid = new THREE.Mesh(midDetailGeom, lodMaterial);
const lodLow = new THREE.Mesh(lowDetailGeom, lodMaterial);

lod.addLevel(lodHigh, 0);
lod.addLevel(lodMid, 6);
lod.addLevel(lodLow, 12);

lod.position.set(-2.5, 0.7, -3);
lod.castShadow = true;
scene.add(lod);

const instanceCount = 180;
const instanceGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
const instanceMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ff88,
  metalness: 0.8,
  roughness: 0.2
});

const instancedGrid = new THREE.InstancedMesh(instanceGeometry, instanceMaterial, instanceCount);
instancedGrid.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

const tempMatrix = new THREE.Matrix4();
const gridRadius = 3.2;

for (let i = 0; i < instanceCount; i++) {
  const angle = (i / instanceCount) * Math.PI * 2;
  const radius = gridRadius + Math.random() * 0.5;
  const y = -0.6 + Math.random() * 1.2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  tempMatrix.makeTranslation(x, y, z);
  instancedGrid.setMatrixAt(i, tempMatrix);
}

instancedGrid.castShadow = true;
scene.add(instancedGrid);

const particlesGeometry = new THREE.BufferGeometry();
const particleCount = 1200;
const particlePositions = new Float32Array(particleCount * 3);
const particleOffsets = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;
  particlePositions[i3 + 0] = (Math.random() - 0.5) * 18;
  particlePositions[i3 + 1] = Math.random() * 6;
  particlePositions[i3 + 2] = (Math.random() - 0.5) * 18;
  particleOffsets[i] = Math.random() * Math.PI * 2;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particlesGeometry.setAttribute('aOffset', new THREE.BufferAttribute(particleOffsets, 1));

const particleUniforms = {
  uTime: { value: 0 },
  uPointerStrength: { value: 0 },
  uBaseColor: { value: new THREE.Color(0x00ff88) }
};

const particleMaterial = new THREE.ShaderMaterial({
  uniforms: particleUniforms,
  vertexShader: `
    attribute float aOffset;
    uniform float uTime;
    uniform float uPointerStrength;
    varying float vStrength;
    void main() {
      vec3 transformed = position;
      float t = uTime * 0.6 + aOffset;
      transformed.y += sin(t) * 0.3;
      transformed.x += cos(t) * 0.15 * uPointerStrength;
      vStrength = 0.4 + 0.6 * uPointerStrength;
      vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
      gl_PointSize = 2.5 * (1.0 + uPointerStrength) * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uBaseColor;
    varying float vStrength;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float alpha = smoothstep(0.5, 0.2, d) * vStrength;
      vec3 color = uBaseColor;
      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(particlesGeometry, particleMaterial);
scene.add(particles);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;

const pointer = new THREE.Vector2(0.5, 0.5);
const pointerTarget = new THREE.Vector2(0.5, 0.5);

let pulseStrength = 0;

function handlePointerMove(event) {
  const rect = container.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  pointerTarget.set(x, y);
}

function handlePointerDown() {
  pulseStrength = 1;
}

container.addEventListener('pointermove', handlePointerMove);
container.addEventListener('pointerdown', handlePointerDown);

let lastTime = 0;
const targetFps = 60;
const frameDuration = 1000 / targetFps;

function animate(currentTime) {
  requestAnimationFrame(animate);

  const delta = currentTime - lastTime;
  if (delta < frameDuration) {
    return;
  }
  lastTime = currentTime - (delta % frameDuration);

  pointer.lerp(pointerTarget, 0.1);

  const centerOffsetX = pointer.x - 0.5;
  const centerOffsetY = pointer.y - 0.5;

  const rotationTargetX = centerOffsetY * 0.6;
  const rotationTargetY = centerOffsetX * 0.8;

  core.rotation.x += (rotationTargetX - core.rotation.x) * 0.08;
  core.rotation.y += (rotationTargetY - core.rotation.y) * 0.08;

  ring.rotation.y += 0.01;

  lod.update(camera);

  const t = currentTime * 0.001;
  mainLight.position.x = Math.cos(t * 0.6) * 4;
  mainLight.position.z = Math.sin(t * 0.6) * 4;

  if (pulseStrength > 0.001) {
    const s = 1 + pulseStrength * 0.35;
    core.scale.set(s, s, s);
    pulseStrength *= 0.9;
  } else {
    core.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
  }

  const pointerIntensity = Math.min(1, Math.abs(centerOffsetX) + Math.abs(centerOffsetY) * 1.2);
  particleUniforms.uPointerStrength.value += (pointerIntensity - particleUniforms.uPointerStrength.value) * 0.08;
  particleUniforms.uTime.value = t;

  const sway = Math.sin(t * 0.6) * 0.15;
  for (let i = 0; i < instanceCount; i++) {
    const angle = (i / instanceCount) * Math.PI * 2 + t * 0.2;
    const radius = gridRadius + Math.sin(t * 0.5 + i) * 0.3;
    const y = -0.6 + Math.sin(t * 0.8 + i) * 0.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    tempMatrix.makeTranslation(x, y + sway, z);
    instancedGrid.setMatrixAt(i, tempMatrix);
  }
  instancedGrid.instanceMatrix.needsUpdate = true;

  controls.update();
  composer.render();
}

animate(0);

window.addEventListener('resize', () => {
  const newWidth = container.clientWidth || window.innerWidth;
  const newHeight = container.clientHeight || window.innerHeight * 0.6;

  camera.aspect = newWidth / newHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(newWidth, newHeight);
  composer.setSize(newWidth, newHeight);
});
