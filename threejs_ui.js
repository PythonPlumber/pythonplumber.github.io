import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { TextureLoader } from 'three';

class ThreeJSUI {
  constructor(container, profileImagePath) {
    this.container = container;
    this.profileImagePath = profileImagePath;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    dispose() {
    this.scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    this.renderer.dispose();
    this.composer.dispose();
    this.controls.dispose();
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('scroll', this.onScroll);
    document.removeEventListener('keydown', this.onKeyDown);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('click', this.onMouseClick);
    this.container.removeEventListener('touchstart', this.onTouchStart);
    this.container.removeEventListener('touchmove', this.onTouchMove);
  });
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.interactiveObjects = [];
    this.particleSystems = [];
    this.glassPanels = [];
    this.physicsObjects = [];
    this.frameRate = 60;
    this.frameDelay = 1000 / this.frameRate;
    this.lastTime = 0;
    this.mouseVelocity = new THREE.Vector2();
    this.lastMousePosition = new THREE.Vector2();
    this.parallaxStrength = 0.5;
    this.scrollOffset = 0;
    
    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupCamera();
    this.setupLighting();
    this.setupEnvironment();
    this.setupPostProcessing();
    this.setupControls();
    this.setupEventListeners();
    this.createGlassUI();
    this.createParticleSystems();
    this.createInteractiveElements();
    this.loadProfileImage();
    this.animate();
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);
  }

  setupCamera() {
    this.camera.position.set(0, 0, 8);
    this.camera.lookAt(0, 0, 0);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x00ff88, 0.8, 100);
    pointLight1.position.set(-5, 3, 2);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x88ff00, 0.6, 100);
    pointLight2.position.set(5, -3, 2);
    this.scene.add(pointLight2);

    const spotLight = new THREE.SpotLight(0xffffff, 0.5);
    spotLight.position.set(0, 10, 0);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.1;
    spotLight.decay = 2;
    spotLight.distance = 200;
    spotLight.castShadow = true;
    this.scene.add(spotLight);
  }

  setupEnvironment() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;
    this.scene.background = new THREE.Color(0x0a0a0a);
  }

  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4,
      0.1,
      0.1
    );
    this.composer.addPass(bloomPass);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.maxDistance = 20;
    this.controls.minDistance = 3;
  }

  setupEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('click', this.onMouseClick.bind(this));
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this));
    window.addEventListener('scroll', this.onScroll.bind(this));
    
    // Add keyboard navigation for accessibility
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    
    // Initialize 3D model viewer
    this.setup3DModelViewer();
  }

  createGlassUI() {
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a1a,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.8,
      envMap: this.scene.environment,
      envMapIntensity: 1.5
    });

    const panelGeometry = new THREE.BoxGeometry(4, 3, 0.2);
    const panel = new THREE.Mesh(panelGeometry, glassMaterial);
    panel.position.set(-3, 1, 0);
    panel.castShadow = true;
    panel.receiveShadow = true;
    this.scene.add(panel);
    this.glassPanels.push(panel);

    const panel2 = new THREE.Mesh(panelGeometry, glassMaterial.clone());
    panel2.position.set(3, -1, 0);
    panel2.rotation.y = Math.PI / 6;
    this.scene.add(panel2);
    this.glassPanels.push(panel2);

    const floatingPanelGeometry = new THREE.BoxGeometry(2.5, 2, 0.15);
    const floatingPanel = new THREE.Mesh(floatingPanelGeometry, glassMaterial.clone());
    floatingPanel.position.set(0, 2, -2);
    floatingPanel.rotation.x = -Math.PI / 8;
    this.scene.add(floatingPanel);
    this.glassPanels.push(floatingPanel);
  }

  createParticleSystems() {
    this.createFloatingParticles();
    this.createGlassParticles();
    this.createInteractiveParticles();
    this.createAdvancedParticleSystem();
  }

  createFloatingParticles() {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      colors[i * 3] = 0.5 + Math.random() * 0.5;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;

      sizes[i] = Math.random() * 0.1 + 0.05;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: this.renderer.getPixelRatio() }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        uniform float pixelRatio;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          mvPosition.x += sin(time + position.y * 0.01) * 0.5;
          mvPosition.y += cos(time + position.x * 0.01) * 0.3;
          
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(particles);
    this.particleSystems.push(particles);
  }

  createGlassParticles() {
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x88ffaa,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(particles);
    this.particleSystems.push(particles);
  }

  createInteractiveParticles() {
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

      colors[i * 3] = 0.2 + Math.random() * 0.8;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.userData.interactive = true;
    this.scene.add(particles);
    this.particleSystems.push(particles);
    this.interactiveObjects.push(particles);
  }

  createInteractiveElements() {
    this.createFloatingSpheres();
    this.createGlassButtons();
    this.create3DText();
  }

  createFloatingSpheres() {
    const sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00ff88,
      metalness: 0.8,
      roughness: 0.1,
      transmission: 0.3,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMap: this.scene.environment,
      envMapIntensity: 2.0
    });

    for (let i = 0; i < 8; i++) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
      const angle = (i / 8) * Math.PI * 2;
      const radius = 6;
      sphere.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.5,
        Math.sin(angle * 2) * 2
      );
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      sphere.userData.interactive = true;
      sphere.userData.originalScale = 1;
      sphere.userData.floatOffset = Math.random() * Math.PI * 2;
      
      this.scene.add(sphere);
      this.interactiveObjects.push(sphere);
    }
  }

  createGlassButtons() {
    const buttonGeometry = new THREE.BoxGeometry(1.5, 0.5, 0.3);
    const buttonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2a2a2a,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.8,
      thickness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMap: this.scene.environment,
      envMapIntensity: 1.2,
      transparent: true,
      opacity: 0.9
    });

    const buttonPositions = [
      { x: -2, y: -2, z: 1 },
      { x: 0, y: -2, z: 1 },
      { x: 2, y: -2, z: 1 }
    ];

    buttonPositions.forEach((pos, index) => {
      const button = new THREE.Mesh(buttonGeometry, buttonMaterial.clone());
      button.position.set(pos.x, pos.y, pos.z);
      button.userData.interactive = true;
      button.userData.buttonId = index;
      button.userData.originalColor = 0x2a2a2a;
      button.userData.hoverColor = 0x00ff88;
      button.castShadow = true;
      button.receiveShadow = true;
      
      this.scene.add(button);
      this.interactiveObjects.push(button);
    });
  }

  create3DText() {
    const textGeometry = new THREE.PlaneGeometry(4, 1);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = '#00ff88';
    context.font = 'bold 48px Inter';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('3D UI INTERFACE', canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 3, 0);
    textMesh.lookAt(this.camera.position);
    this.scene.add(textMesh);
  }

  loadProfileImage() {
    const textureLoader = new TextureLoader();
    textureLoader.load(this.profileImagePath, (texture) => {
      const profileGeometry = new THREE.PlaneGeometry(2, 2);
      const profileMaterial = new THREE.MeshPhysicalMaterial({
        map: texture,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.2,
        thickness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        envMap: this.scene.environment,
        envMapIntensity: 0.5
      });
      
      const profileMesh = new THREE.Mesh(profileGeometry, profileMaterial);
      profileMesh.position.set(0, 0, -1);
      profileMesh.userData.interactive = true;
      profileMesh.userData.isProfile = true;
      profileMesh.castShadow = true;
      profileMesh.receiveShadow = true;
      
      this.scene.add(profileMesh);
      this.interactiveObjects.push(profileMesh);
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    const rect = this.container.getBoundingClientRect();
    const currentMouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    // Calculate mouse velocity for physics-based interactions
    this.mouseVelocity.subVectors(currentMouse, this.lastMousePosition);
    this.mouseVelocity.multiplyScalar(0.8); // Damping
    
    this.mouse.copy(currentMouse);
    this.lastMousePosition.copy(currentMouse);
    
    this.checkIntersections();
    this.updateParallaxEffect();
  }

  onTouchStart(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.checkIntersections();
    }
  }

  onTouchMove(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.checkIntersections();
    }
  }

  onMouseClick(event) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      this.handleObjectClick(object);
    }
  }

  checkIntersections() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects);
    
    this.interactiveObjects.forEach(obj => {
      if (obj.userData.isHovered) {
        this.resetObjectHover(obj);
      }
    });
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      this.applyObjectHover(object);
    }
  }

  applyObjectHover(object) {
    object.userData.isHovered = true;
    
    if (object.userData.buttonId !== undefined) {
      object.material.color.setHex(object.userData.hoverColor);
      object.scale.setScalar(1.1);
    } else if (object.userData.isProfile) {
      object.scale.setScalar(1.05);
      object.material.opacity = 0.9;
    } else {
      object.scale.setScalar(1.2);
      if (object.material.emissive) {
        object.material.emissive.setHex(0x004422);
      }
    }
  }

  resetObjectHover(object) {
    object.userData.isHovered = false;
    
    if (object.userData.buttonId !== undefined) {
      object.material.color.setHex(object.userData.originalColor);
      object.scale.setScalar(1);
    } else if (object.userData.isProfile) {
      object.scale.setScalar(1);
      object.material.opacity = 1;
    } else {
      object.scale.setScalar(1);
      if (object.material.emissive) {
        object.material.emissive.setHex(0x000000);
      }
    }
  }

  handleObjectClick(object) {
    if (object.userData.buttonId !== undefined) {
      this.animateButtonClick(object);
    } else if (object.userData.isProfile) {
      this.animateProfileClick(object);
    } else {
      this.animateSphereClick(object);
    }
  }

  animateButtonClick(button) {
    const originalScale = button.scale.clone();
    button.scale.setScalar(0.8);
    
    setTimeout(() => {
      button.scale.copy(originalScale);
    }, 150);
    
    this.createClickParticles(button.position);
  }

  animateProfileClick(profile) {
    const originalRotation = profile.rotation.z;
    profile.rotation.z += Math.PI * 2;
    
    setTimeout(() => {
      profile.rotation.z = originalRotation;
    }, 1000);
    
    this.createClickParticles(profile.position);
  }

  animateSphereClick(sphere) {
    const originalPosition = sphere.position.clone();
    sphere.position.y += 0.5;
    
    setTimeout(() => {
      sphere.position.copy(originalPosition);
    }, 300);
    
    this.createClickParticles(sphere.position);
  }

  createClickParticles(position) {
    const particleCount = 20;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 1] = Math.random() * 0.2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ff88,
      size: 0.1,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.userData.isClickParticles = true;
    particles.userData.life = 1.0;
    this.scene.add(particles);
    
    setTimeout(() => {
      this.scene.remove(particles);
      particleGeometry.dispose();
      particleMaterial.dispose();
    }, 1000);
  }

  updateParticles(deltaTime) {
    this.particleSystems.forEach(particles => {
      if (particles.material.uniforms && particles.material.uniforms.time) {
        particles.material.uniforms.time.value += deltaTime;
        
        // Add mouse influence to advanced particles
        if (particles.userData.isAdvancedParticles && particles.material.uniforms.mouseInfluence) {
          particles.material.uniforms.mouseInfluence.value = this.mouseVelocity.length() * 10;
        }
      }
      
      if (particles.userData.isClickParticles) {
        particles.userData.life -= deltaTime * 2;
        particles.material.opacity = particles.userData.life;
        
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.attributes.velocity.array;
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i] * deltaTime * 60;
          positions[i + 1] += velocities[i + 1] * deltaTime * 60;
          positions[i + 2] += velocities[i + 2] * deltaTime * 60;
          
          velocities[i + 1] -= 0.01 * deltaTime * 60;
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
      }
    });
  }

  updateGlassPanels(deltaTime) {
    this.glassPanels.forEach((panel, index) => {
      panel.rotation.y += Math.sin(this.clock.getElapsedTime() + index) * 0.001;
      panel.position.y += Math.cos(this.clock.getElapsedTime() + index * 0.5) * 0.002;
    });
  }

  updateInteractiveObjects(deltaTime) {
    this.interactiveObjects.forEach(obj => {
      if (obj.userData.floatOffset !== undefined) {
        obj.position.y += Math.sin(this.clock.getElapsedTime() + obj.userData.floatOffset) * 0.01;
        obj.rotation.x += 0.005;
        obj.rotation.y += 0.003;
      }
    });
  }

  animate(timestamp) {
    requestAnimationFrame(this.animate.bind(this));
    
    const elapsed = timestamp - this.lastTime;
    if (elapsed > this.frameDelay) {
      this.lastTime = timestamp - (elapsed % this.frameDelay);
      
      const deltaTime = this.clock.getDelta();
      
      this.controls.update();
      this.updateParticles(deltaTime);
      this.updateGlassPanels(deltaTime);
      this.updateInteractiveObjects(deltaTime);
      
      this.composer.render();
    }
  }

  updateParallaxEffect() {
    // Apply parallax scrolling based on mouse position and scroll offset
    const parallaxX = this.mouse.x * this.parallaxStrength;
    const parallaxY = (this.mouse.y + this.scrollOffset * 0.001) * this.parallaxStrength;
    
    this.glassPanels.forEach((panel, index) => {
      const multiplier = (index + 1) * 0.2;
      panel.position.x += (parallaxX * multiplier - panel.position.x) * 0.05;
      panel.position.y += (parallaxY * multiplier - panel.position.y) * 0.05;
    });
  }

  onScroll(event) {
    this.scrollOffset = window.pageYOffset || document.documentElement.scrollTop;
    this.updateParallaxEffect();
  }

  onKeyDown(event) {
    // Accessibility: Keyboard navigation for interactive elements
    switch(event.key) {
      case 'Enter':
      case ' ':
        // Simulate click on focused element
        if (this.interactiveObjects.length > 0) {
          const focusedObject = this.interactiveObjects[0];
          this.handleObjectClick(focusedObject);
        }
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        // Navigate between interactive elements
        this.navigateInteractiveElements(event.key);
        break;
    }
  }

  navigateInteractiveElements(direction) {
    if (this.interactiveObjects.length === 0) return;
    
    // Simple navigation logic - cycle through objects
    let currentIndex = 0;
    
    switch(direction) {
      case 'ArrowRight':
      case 'ArrowDown':
        currentIndex = (currentIndex + 1) % this.interactiveObjects.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        currentIndex = (currentIndex - 1 + this.interactiveObjects.length) % this.interactiveObjects.length;
        break;
    }
    
    // Highlight the current object
    this.interactiveObjects.forEach((obj, index) => {
      if (index === currentIndex) {
        this.applyObjectHover(obj);
      } else {
        this.resetObjectHover(obj);
      }
    });
  }

  createPhysicsBasedAnimation(object, targetPosition, duration = 1000) {
    const startPosition = object.position.clone();
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const eased = this.easeInOutCubic(progress);
      
      object.position.lerpVectors(startPosition, targetPosition, eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  createAdvancedParticleSystem() {
    // Create a more complex particle system with physics
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      colors[i * 3] = 0.2 + Math.random() * 0.8;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
      
      sizes[i] = Math.random() * 0.15 + 0.05;
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: this.renderer.getPixelRatio() },
        mouseInfluence: { value: 0.0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute vec3 velocity;
        varying vec3 vColor;
        uniform float time;
        uniform float pixelRatio;
        uniform float mouseInfluence;
        
        void main() {
          vColor = color;
          vec3 pos = position;
          
          // Apply physics-based movement
          pos += velocity * time * 10.0;
          
          // Add some turbulence
          pos.x += sin(time * 0.5 + position.y * 0.1) * 0.5;
          pos.y += cos(time * 0.3 + position.x * 0.1) * 0.3;
          pos.z += sin(time * 0.7 + position.x * 0.05) * 0.4;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.userData.isAdvancedParticles = true;
    this.scene.add(particles);
    this.particleSystems.push(particles);
  }

  dispose() {
    this.scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    this.renderer.dispose();
    this.composer.dispose();
    this.controls.dispose();
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('scroll', this.onScroll);
    document.removeEventListener('keydown', this.onKeyDown);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('click', this.onMouseClick);
    this.container.removeEventListener('touchstart', this.onTouchStart);
    this.container.removeEventListener('touchmove', this.onTouchMove);
  }
}

export default ThreeJSUI;