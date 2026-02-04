import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Set up the scene
const scene = new THREE.Scene();

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); // alpha: true for transparent background, antialias for smoother edges
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // For better quality on high-DPI screens
document.getElementById('threejs-container').appendChild(renderer.domElement);

// Post-processing for bloom effect
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0;
bloomPass.strength = 1.5; // Adjust bloom strength
bloomPass.radius = 0;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // soft white light, reduced intensity
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Add a TorusKnot to the scene
const geometry = new THREE.TorusKnotGeometry(1, 0.4, 100, 16);
const material = new THREE.MeshStandardMaterial({
  color: 0x00ffff, // Cyan color for a futuristic glow
  emissive: 0x00ffff, // Emissive color for self-illumination
  emissiveIntensity: 0.5, // How strong the emissive light is
  roughness: 0.1,
  metalness: 0.9,
  transparent: true,
  opacity: 0.8,
});
const torusKnot = new THREE.Mesh(geometry, material);
scene.add(torusKnot);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when damping is enabled
controls.dampingFactor = 0.05;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  torusKnot.rotation.x += 0.005;
  torusKnot.rotation.y += 0.005;

  controls.update(); // only required if controls.enableDamping is set to true
  composer.render(); // Render with post-processing
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
