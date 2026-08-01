import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls.js";
import { OBJLoader } from "three/addons/OBJLoader.js";

const initializedViewers = new WeakSet();
const activeViewers = new Set();
const viewersByMovementId = new Map();
const roleMaterials = new Map();
const selectedMuscleColor = 0xc8ff00;
const roleColors = {
  primary: 0x3f3f3f,
  secondary: 0x777777,
  support: 0xb3b3b3
};
const fallbackRoleGroups = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "support", label: "Support" }
];
const contextMuscleGroups = {
  leg: [
    "quadriceps",
    "gluteus_maximus",
    "gluteus_medius",
    "adductor_longus",
    "gastrocnemius",
    "hamstrings"
  ],
  back: [
    "teres_major",
    "middle_trapezius",
    "rhomboids",
    "posterior_deltoid",
    "erector_spinae",
    "trapezius_middle_lower",
    "pectoralis_major",
    "anterior_deltoid",
    "biceps_brachii",
    "rotator_cuff"
  ]
};
window.renderLocalAnatomyViewers = () => {
  pruneDetachedViewers();
  document.querySelectorAll(".local-anatomy-viewer").forEach(container => {
    if (initializedViewers.has(container)) return;
    if (container.closest("[hidden], [inert]")) return;
    if (!hasVisibleSize(container)) return;

    const workout = container.dataset.workoutId
      ? window.workoutApp?.workoutRecordById?.(container.dataset.workoutId)
      : null;
    const movement = container.dataset.movementId
      ? window.workoutApp?.movementLibrary?.find(item => item.id === container.dataset.movementId)
      : null;
    const subject = workout || movement;
    if (!subject) {
      initializedViewers.add(container);
      showViewerMessage(container, container.dataset.workoutId ? "Missing workout data" : "Missing movement data");
      return;
    }

    const parts = workout ? workoutMeshParts(workout) : movementMeshParts(movement);
    if (!parts.length) {
      const viewer = createSubjectFallback(container, subject);
      initializedViewers.add(container);
      if (viewer) {
        if (movement) {
          registerMovementViewer(movement.id, viewer);
          const selectedMuscle = window.workoutApp?.selectedMuscles?.[movement.id];
          if (selectedMuscle) viewer.setSelection(selectedMuscle);
        }
      } else {
        showViewerMessage(container, workout ? "No local workout meshes" : "No local movement meshes");
      }
      return;
    }

    try {
      const viewer = createLocalAnatomyViewer(container, subject, parts);
      initializedViewers.add(container);
      activeViewers.add(viewer);
      if (movement) registerMovementViewer(movement.id, viewer);

      const selectedMuscle = movement ? window.workoutApp?.selectedMuscles?.[movement.id] : null;
      if (selectedMuscle) viewer.setSelection(selectedMuscle);
    } catch (error) {
      initializedViewers.add(container);
      console.error("Could not initialize local anatomy viewer", error);
      const viewer = createSubjectFallback(container, subject);
      if (viewer && movement) {
        registerMovementViewer(movement.id, viewer);
        const selectedMuscle = window.workoutApp?.selectedMuscles?.[movement.id];
        if (selectedMuscle) viewer.setSelection(selectedMuscle);
      }
      if (!viewer) showViewerMessage(container, "3D viewer unavailable");
    }
  });
};

window.setAnatomySelection = (movementId, muscleId) => {
  pruneDetachedViewers();
  viewersByMovementId.get(movementId)?.setSelection(muscleId);
};

function registerMovementViewer(movementId, viewer) {
  const previousViewer = viewersByMovementId.get(movementId);
  if (previousViewer && previousViewer !== viewer) previousViewer.dispose?.();
  viewersByMovementId.set(movementId, viewer);
}

function pruneDetachedViewers() {
  activeViewers.forEach(viewer => {
    if (viewerIsInactive(viewer)) viewer.dispose();
  });
  viewersByMovementId.forEach((viewer, movementId) => {
    if (viewerIsInactive(viewer)) viewersByMovementId.delete(movementId);
  });
}

function viewerIsInactive(viewer) {
  return !document.body.contains(viewer.container) || Boolean(viewer.container.closest("[hidden], [inert]"));
}

requestAnimationFrame(() => window.renderLocalAnatomyViewers());

function createLocalAnatomyViewer(container, movement, parts) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7f7f7);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
  camera.up.set(0, 0, 1);
  camera.position.set(0, cameraYForMovement(movement), 1.15);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xf7f7f7, 1);

  container.replaceChildren(renderer.domElement);
  const selectionLabel = document.createElement("div");
  selectionLabel.className = "anatomy-selection-label";
  container.append(selectionLabel);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 2.1;
  controls.maxDistance = 8;
  controls.target.set(0, 0, 0.15);

  scene.add(new THREE.HemisphereLight(0xf2ede4, 0x131118, 1.6));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
  keyLight.position.set(2.4, -3.6, 3.2);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xf2f2ee, 1.2);
  rimLight.position.set(-2.2, 2.5, 2);
  scene.add(rimLight);

  const root = new THREE.Group();
  scene.add(root);

  const loader = new OBJLoader();
  const meshesByMuscleId = new Map();
  let animationFrame = 0;
  let disposed = false;
  let isVisible = true;
  let viewer;
  const loadJobs = parts.flatMap(part =>
    part.muscle.meshFiles.map(file => loadPart(loader, file, part, root, meshesByMuscleId))
  );

  Promise.allSettled(loadJobs).then(results => {
    if (disposed) {
      disposeObjectGeometries(root);
      return;
    }
    const failed = results.filter(result => result.status === "rejected");
    const loadedMeshCount = [...meshesByMuscleId.values()].reduce((sum, meshes) => sum + meshes.length, 0);
    if (!loadedMeshCount) {
      if (failed.length) console.warn("BodyParts3D mesh load failures", failed);
      dispose();
      const fallbackViewer = createSubjectFallback(container, movement);
      if (!isWorkoutSubject(movement) && fallbackViewer) registerMovementViewer(movement.id, fallbackViewer);
      if (!fallbackViewer) showViewerMessage(container, "3D mesh unavailable");
      return;
    }
    if (failed.length) console.warn("BodyParts3D partial mesh load failures", failed);

    frameObject(root, camera, controls, movement);
    const selectedMuscle = window.workoutApp?.selectedMuscles?.[movement.id];
    if (selectedMuscle) setSelection(selectedMuscle);
  });

  const resizeObserver = new ResizeObserver(() => resizeRenderer(container, renderer, camera));
  resizeObserver.observe(container);
  resizeRenderer(container, renderer, camera);

  const visibilityObserver = new IntersectionObserver(entries => {
    isVisible = entries.some(entry => entry.isIntersecting);
    if (isVisible) scheduleAnimation();
    else stopAnimation();
  });
  visibilityObserver.observe(container);

  document.addEventListener("visibilitychange", scheduleAnimation);

  function scheduleAnimation() {
    if (disposed || !isVisible || document.hidden || animationFrame) return;
    animationFrame = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (!animationFrame) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  function animate() {
    animationFrame = 0;
    if (disposed) return;
    if (!document.body.contains(container)) {
      dispose();
      return;
    }
    if (!isVisible || document.hidden) return;

    controls.update();
    renderer.render(scene, camera);
    scheduleAnimation();
  }
  scheduleAnimation();

  function setSelection(muscleId) {
    const selectedMeshes = meshesByMuscleId.get(muscleId) || [];
    const hasSelection = selectedMeshes.length > 0;

    meshesByMuscleId.forEach(meshes => {
      meshes.forEach(mesh => {
        const selected = mesh.userData.muscleId === muscleId;
        mesh.material = materialForMeshState(mesh, hasSelection && !selected ? "dimmed" : selected ? "selected" : "base");
        setMeshOutline(mesh, selected);
      });
    });

    if (!hasSelection) {
      selectionLabel.classList.remove("visible");
      return;
    }

    const { muscleName, role } = selectedMeshes[0].userData;
    selectionLabel.textContent = `${formatRole(role)}: ${muscleName}`;
    selectionLabel.classList.add("visible");
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    stopAnimation();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener("visibilitychange", scheduleAnimation);
    controls.dispose();
    disposeObjectGeometries(root);
    renderer.dispose();
    renderer.forceContextLoss();
    activeViewers.delete(viewer);
    if (!isWorkoutSubject(movement) && viewersByMovementId.get(movement.id) === viewer) {
      viewersByMovementId.delete(movement.id);
    }
  }

  viewer = { container, dispose, setSelection };
  return viewer;
}

function hasVisibleSize(element) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function disposeObjectGeometries(root) {
  root.traverse(object => object.geometry?.dispose?.());
}

function movementMeshParts(movement) {
  const musclesById = new Map((window.workoutApp?.anatomyMuscles || []).map(muscle => [muscle.id, muscle]));
  const roles = window.workoutApp?.muscleRolesForMovement?.(movement) || {};
  const usedMeshFiles = new Set();
  const parts = Object.entries(roles)
    .map(([id, role]) => ({ muscle: musclesById.get(id), role }))
    .filter(part => part.muscle?.meshFiles?.length);

  parts.forEach(part => {
    part.muscle.meshFiles.forEach(file => usedMeshFiles.add(file));
  });

  const contextGroup = movementContextGroup(movement, roles);
  const contextParts = (contextMuscleGroups[contextGroup] || [])
    .filter(id => !roles[id])
    .map(id => musclesById.get(id))
    .filter(muscle => muscle?.meshFiles?.length)
    .filter(muscle => !muscle.meshFiles.some(file => usedMeshFiles.has(file)))
    .map(muscle => ({ muscle, role: "context" }));

  return [...parts, ...contextParts];
}

function workoutMeshParts(workout) {
  const app = window.workoutApp || {};
  const musclesById = new Map((app.anatomyMuscles || []).map(muscle => [muscle.id, muscle]));
  const heatmap = app.workoutMuscleHeatmap?.(workout) || [];
  const maxScore = Math.max(...heatmap.map(item => Number(item.score) || 0), 1);
  const usedMeshFiles = new Set();

  return heatmap
    .map(item => {
      const muscleId = app.muscleIdForName?.(item.name) || fallbackMuscleId(item.name);
      const muscle = musclesById.get(muscleId);
      return {
        muscle,
        role: "workout",
        color: workout.color || "#c8ff00",
        score: Number(item.score) || 0,
        intensity: Math.max(0.08, Math.min(1, (Number(item.score) || 0) / maxScore))
      };
    })
    .filter(part => part.muscle?.meshFiles?.length)
    .filter(part => {
      const unseen = part.muscle.meshFiles.some(file => !usedMeshFiles.has(file));
      part.muscle.meshFiles.forEach(file => usedMeshFiles.add(file));
      return unseen;
    });
}

function movementContextGroup(movement, roles) {
  const roleIds = new Set(Object.keys(roles));
  const lowerBodyIds = ["quadriceps", "gluteus_maximus", "gluteus_medius", "adductor_longus", "gastrocnemius", "hamstrings", "biceps_femoris", "semitendinosus", "semimembranosus"];
  if (lowerBodyIds.some(id => roleIds.has(id)) || /leg_curl|lunge/i.test(movement.id)) return "leg";
  const backIds = ["teres_major", "middle_trapezius", "rhomboids", "posterior_deltoid", "erector_spinae", "trapezius_middle_lower"];
  if (backIds.some(id => roleIds.has(id)) || /row|pulldown/i.test(movement.id)) return "back";
  return null;
}

async function loadPart(loader, file, part, root, meshesByMuscleId) {
  const meshBase = window.workoutApp?.anatomyMeshBase || "./assets/bodyparts3d/";
  const object = await loader.loadAsync(meshBase + file);
  const role = part.role;
  const material = materialForPart(part, "base");
  const muscleName = part.muscle.displayName || part.muscle.name;

  object.traverse(child => {
    if (!child.isMesh) return;
    child.material = material;
    child.userData.muscleId = part.muscle.id;
    child.userData.muscleName = muscleName;
    child.userData.role = role;
    child.userData.workoutColor = part.color || "#c8ff00";
    child.userData.score = part.score || 0;
    child.userData.intensity = part.intensity || 0;
    child.renderOrder = role === "context" ? 1 : 2;
    if (!meshesByMuscleId.has(part.muscle.id)) {
      meshesByMuscleId.set(part.muscle.id, []);
    }
    meshesByMuscleId.get(part.muscle.id).push(child);
    if (!child.geometry.attributes.normal) {
      child.geometry.computeVertexNormals();
    }
  });

  root.add(object);
  return object;
}

function materialForPart(part, state) {
  if (part.role === "workout") return materialForWorkoutIntensity(part.color, part.intensity, state);
  return materialForRole(part.role, state);
}

function materialForMeshState(mesh, state) {
  if (mesh.userData.role === "workout") return materialForWorkoutIntensity(mesh.userData.workoutColor, mesh.userData.intensity, state);
  return materialForRole(mesh.userData.role, state);
}

function materialForRole(role, state) {
  const key = `${role}:${state}`;
  if (!roleMaterials.has(key)) {
    const color = state === "selected" ? selectedMuscleColor : roleColors[role] ?? 0xd7dde3;
    const opacity = materialOpacity(role, state);
    roleMaterials.set(key, new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: state === "selected" ? 0.38 : 0.18,
      opacity,
      roughness: 0.72,
      metalness: 0,
      transparent: opacity < 1,
      depthWrite: opacity >= 0.7,
      side: THREE.DoubleSide
    }));
  }

  return roleMaterials.get(key);
}

function materialForWorkoutIntensity(colorValue, intensity, state) {
  const colorHex = /^#[0-9a-f]{6}$/i.test(String(colorValue || "")) ? String(colorValue) : "#c8ff00";
  const clamped = Math.max(0, Math.min(1, Number(intensity) || 0));
  const bucket = Math.round(clamped * 12);
  const key = `workout:${state}:${colorHex}:${bucket}`;
  if (!roleMaterials.has(key)) {
    const color = state === "selected"
      ? new THREE.Color(selectedMuscleColor)
      : workoutGradientColor(colorHex, bucket / 12);
    const opacity = state === "dimmed" ? 0.22 : 0.5 + (bucket / 12) * 0.48;
    roleMaterials.set(key, new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: state === "selected" ? 0.36 : 0.08 + (bucket / 12) * 0.18,
      opacity,
      roughness: 0.72,
      metalness: 0,
      transparent: opacity < 1,
      depthWrite: opacity >= 0.7,
      side: THREE.DoubleSide
    }));
  }

  return roleMaterials.get(key);
}

function workoutGradientColor(colorHex, intensity) {
  const low = new THREE.Color(0xdfe8e1);
  const high = new THREE.Color(colorHex);
  return low.lerp(high, Math.max(0, Math.min(1, Number(intensity) || 0)));
}

function materialOpacity(role, state) {
  if (role === "context") return 0.12;
  if (state === "dimmed") return 0.2;
  return 1;
}

function setMeshOutline(mesh, selected) {
  if (!selected) {
    mesh.userData.outline?.removeFromParent();
    mesh.userData.outline = null;
    return;
  }

  if (mesh.userData.outline) return;

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 35),
    new THREE.LineBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.82
    })
  );
  outline.renderOrder = 10;
  mesh.add(outline);
  mesh.userData.outline = outline;
}

function formatRole(role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function cameraYForMovement(movement) {
  const id = String(movement?.id || "");
  if (/row|pulldown|leg_curl/i.test(id)) return 4.2;
  return -4.2;
}

function frameObject(root, camera, controls, movement) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  const scale = maxDimension ? 3.2 / maxDimension : 1;

  root.scale.setScalar(scale);
  root.position.copy(center).multiplyScalar(-scale);

  controls.target.set(0, 0, 0.1);
  camera.position.set(0, cameraYForMovement(movement), 1.15);
  camera.lookAt(controls.target);
  controls.update();
}

function resizeRenderer(container, renderer, camera) {
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function createSubjectFallback(container, subject) {
  return isWorkoutSubject(subject)
    ? createWorkoutMapFallback(container, subject)
    : createMuscleMapFallback(container, subject);
}

function isWorkoutSubject(subject) {
  return Boolean(subject?.blocks || subject?.movements || subject?.date);
}

function createWorkoutMapFallback(container, workout) {
  const app = window.workoutApp || {};
  const heatmap = app.workoutMuscleHeatmap?.(workout) || [];
  if (!heatmap.length) return null;

  const root = document.createElement("div");
  root.className = "anatomy-fallback";

  const header = document.createElement("div");
  const title = document.createElement("h4");
  title.textContent = "Muscle map";
  const note = document.createElement("p");
  note.textContent = "3D viewer unavailable; showing the workout heatmap.";
  header.append(title, note);

  const grid = document.createElement("div");
  grid.className = "anatomy-fallback-grid";

  const card = document.createElement("div");
  card.className = "anatomy-fallback-role";
  const muscles = document.createElement("div");
  muscles.className = "anatomy-fallback-muscles";
  const maxScore = Math.max(...heatmap.map(item => Number(item.score) || 0), 1);
  const color = /^#[0-9a-f]{6}$/i.test(String(workout.color || "")) ? workout.color : "#c8ff00";

  heatmap.forEach(item => {
    const intensity = Math.max(0.08, Math.min(1, (Number(item.score) || 0) / maxScore));
    const chip = document.createElement("span");
    chip.className = "anatomy-fallback-chip workout";
    chip.style.setProperty("--chip-color", color);
    chip.style.setProperty("--chip-alpha", `${Math.round(18 + intensity * 58)}%`);
    chip.title = `${item.name}: ${item.score}`;
    chip.textContent = item.name;
    muscles.append(chip);
  });

  card.append(muscles);
  grid.append(card);
  root.append(header, grid);
  container.replaceChildren(root);

  return { container, setSelection() {} };
}

function createMuscleMapFallback(container, movement) {
  const root = document.createElement("div");
  root.className = "anatomy-fallback";

  const header = document.createElement("div");
  const title = document.createElement("h4");
  title.textContent = "Muscle map";
  const note = document.createElement("p");
  note.textContent = "3D mesh not imported yet.";
  header.append(title, note);

  const grid = document.createElement("div");
  grid.className = "anatomy-fallback-grid";

  fallbackRoleGroups.forEach(group => {
    const card = document.createElement("div");
    card.className = "anatomy-fallback-role";

    const label = document.createElement("strong");
    label.className = `role-label ${group.key}`;
    label.textContent = group.label;

    const muscles = document.createElement("div");
    muscles.className = "anatomy-fallback-muscles";
    const list = movement.muscles?.[group.key] || [];
    if (!list.length) {
      const empty = document.createElement("span");
      empty.className = "movement-count";
      empty.textContent = "Pending";
      muscles.append(empty);
    }
    list.forEach(muscle => {
      const chip = document.createElement("span");
      chip.className = "anatomy-fallback-chip";
      chip.dataset.muscleId = fallbackMuscleId(muscle.name);
      chip.textContent = muscle.name;
      muscles.append(chip);
    });

    card.append(label, muscles);
    grid.append(card);
  });

  root.append(header, grid);
  container.replaceChildren(root);

  function setSelection(muscleId) {
    root.querySelectorAll(".anatomy-fallback-chip").forEach(chip => {
      chip.classList.toggle("active", chip.dataset.muscleId === muscleId);
    });
  }

  return { container, setSelection };
}

function fallbackMuscleId(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function showViewerMessage(container, message) {
  const label = document.createElement("div");
  label.className = "anatomy-loading";
  label.textContent = message;
  container.replaceChildren(label);
}
