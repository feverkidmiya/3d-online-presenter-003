const container = document.getElementById('webgl-container');
const viewportContainer = document.getElementById('viewport-container');
const loadingTip = document.getElementById('loading-tip');

// 1. 初始化场景与相机
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 0, 3.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

// 2. 柔和光照系统
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xfff4e6, 1.5);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// 3. 轨道控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 4. 加载测试模型 (GitHub Raw)
const modelUrl = 'https://raw.githubusercontent.com/feverkidmiya/digital-heritage-assets/main/snuff_bottle_c._1780-1850_ce_1k.glb';

let modelRoot = null;
let isAutoRotating = false;
let originalMaterials = new Map();

const loader = new THREE.GLTFLoader();
loader.load(
  modelUrl,
  (gltf) => {
    modelRoot = gltf.scene;
    
    // 居中显示
    const box = new THREE.Box3().setFromObject(modelRoot);
    const center = box.getCenter(new THREE.Vector3());
    modelRoot.position.sub(center);
    
    // 备份原始材质
    modelRoot.traverse((child) => {
      if (child.isMesh && child.material) {
        originalMaterials.set(child.uuid, child.material);
      }
    });

    scene.add(modelRoot);
    loadingTip.style.display = 'none';
  },
  undefined,
  (err) => {
    console.error(err);
    loadingTip.innerText = '加载失败，请检查网络';
  }
);

// 5. 渲染循环
function animate() {
  requestAnimationFrame(animate);
  if (isAutoRotating && modelRoot) {
    modelRoot.rotation.y += 0.005;
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// 材质与背景交互函数
window.setBg = (color) => {
  viewportContainer.style.backgroundColor = color;
};

window.setMaterialMode = (mode) => {
  if (!modelRoot) return;
  modelRoot.traverse((child) => {
    if (child.isMesh) {
      if (mode === 'standard') {
        child.material = originalMaterials.get(child.uuid) || child.material;
      } else if (mode === 'wireframe') {
        child.material = new THREE.MeshBasicMaterial({ color: 0x334A3E, wireframe: true });
      } else if (mode === 'normal') {
        child.material = new THREE.MeshNormalMaterial();
      }
    }
  });
};

// 弹窗逻辑
const modal = document.getElementById('modal-material');
document.getElementById('btn-material').onclick = () => modal.classList.remove('hidden');
document.querySelector('.close-modal').onclick = () => modal.classList.add('hidden');

// 旋转与重置
const btnRotate = document.getElementById('btn-rotate');
btnRotate.onclick = () => {
  isAutoRotating = !isAutoRotating;
  btnRotate.style.color = isAutoRotating ? '#A34828' : '#2C3E35';
};

document.getElementById('btn-reset').onclick = () => {
  camera.position.set(0, 0, 3.5);
  controls.reset();
  isAutoRotating = false;
  btnRotate.style.color = '#2C3E35';
  if (modelRoot) modelRoot.rotation.set(0, 0, 0);
};