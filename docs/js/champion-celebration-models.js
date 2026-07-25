import * as THREE from "./vendor/three.module.min.js";

export const TEAMMATE_COUNT = 6;
export const TOTAL_PLAYER_COUNT = 7;
export const MAX_CROWD_INSTANCES = 480;
export const PHONE_CROWD_INSTANCES = 260;
export const PLAYER_RADIAL_SEGMENTS = 32;
export const PLAYER_HEAD_SEGMENTS = 40;
export const PLAYER_CAP_SEGMENTS = 14;
export const PLAYER_FINGER_COUNT = 3;
export const PLAYER_HAIR_STYLE_COUNT = 7;
export const PLAYER_FACIAL_HAIR_STYLE_COUNT = 5;
export const PLAYER_SKIN_TONES = Object.freeze([
  "#4b2d22",
  "#603b2b",
  "#754a33",
  "#8b5e3c",
  "#a9704f",
  "#c68c68",
  "#d8a47d",
  "#e4b796",
  "#efc9ab",
]);
export const PLAYER_HAIR_TONES = Object.freeze([
  "#14110f",
  "#231914",
  "#36241b",
  "#4a3022",
  "#67432a",
  "#8a5c36",
  "#b1865d",
  "#34363d",
]);
export const PLAYER_PROPORTIONS = Object.freeze({
  minimumHeightScale: 0.94,
  maximumHeightScale: 1.06,
  shoulderHeight: 2.08,
  upperArmLength: 0.58,
  forearmLength: 0.56,
});
export const STAGE_LAYOUT = Object.freeze({
  plinthX: -3.5,
  plinthZ: 0.35,
  podiumX: 2.35,
  podiumZ: 0,
  captainEntryX: -5.85,
  captainGroundZ: 0.18,
  captainApproachX: -4.25,
  captainApproachZ: -0.18,
  captainPlinthZ: -0.38,
  captainPodiumApproachX: -1.1,
  captainPodiumApproachZ: 1.32,
  captainFinalX: 2.35,
  captainFinalZ: 1.05,
  teamZ: -0.18,
  bannerX: 0,
  cameraStartX: -1.35,
  cameraEndX: 2.35,
});
export const STAGE_HEIGHTS = Object.freeze({
  ground: 0,
  teammatePodiumTop: 0.72,
  captainPodiumTop: 0.5,
  podiumTop: 0.72,
  playerFoot: 0.72,
  plinthTop: 1.12,
  trophyRest: 1.58,
  trophyCarry: 2.02,
  trophyLift: 3.58,
  teamJump: 0.32,
});

export function playerAppearanceForVariant(variant) {
  if (!Number.isInteger(variant) || variant < 0) {
    throw new RangeError("Player appearance variant must be a non-negative integer.");
  }
  return {
    skinTone: PLAYER_SKIN_TONES[(variant * 4 + 4) % PLAYER_SKIN_TONES.length],
    hairTone: PLAYER_HAIR_TONES[(variant * 3 + 1) % PLAYER_HAIR_TONES.length],
    hairStyle: variant % PLAYER_HAIR_STYLE_COUNT,
    facialHairStyle: variant % PLAYER_FACIAL_HAIR_STYLE_COUNT,
  };
}

function seededUnit(seed) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function createOwner(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  let disposed = false;

  return {
    geometry(value) {
      geometries.add(value);
      return value;
    },
    material(value) {
      materials.add(value);
      return value;
    },
    texture(value) {
      textures.add(value);
      return value;
    },
    retainGeometries(retained) {
      for (const geometry of geometries) {
        if (retained.has(geometry)) continue;
        geometry.dispose();
        geometries.delete(geometry);
      }
    },
    retainMaterials(retained) {
      for (const material of materials) {
        if (retained.has(material)) continue;
        material.dispose();
        materials.delete(material);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      geometries.clear();
      materials.clear();
      textures.clear();
      root.clear();
    },
  };
}

function addMesh(parent, geometry, material, position, scale = null) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function geometryAttributeSignature(geometry) {
  if (!geometry?.attributes?.position || Object.keys(geometry.morphAttributes || {}).length) {
    return null;
  }
  const attributes = Object.entries(geometry.attributes).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  if (attributes.some(([name, attribute]) =>
    !["color", "normal", "position", "uv"].includes(name) ||
    attribute.isInterleavedBufferAttribute,
  )) {
    return null;
  }
  return attributes.map(([name, attribute]) => [
    name,
    attribute.itemSize,
    attribute.normalized ? 1 : 0,
    attribute.array.constructor.name,
  ].join(":")).join("|") + `|index:${geometry.index ? 1 : 0}`;
}

function mergeTransformedGeometries(meshes) {
  const geometries = [];
  const normalMatrices = [];
  let totalVertices = 0;
  let totalIndices = 0;
  for (const mesh of meshes) {
    mesh.updateMatrix();
    geometries.push(mesh.geometry);
    normalMatrices.push(new THREE.Matrix3().getNormalMatrix(mesh.matrix));
    totalVertices += mesh.geometry.attributes.position.count;
    totalIndices += mesh.geometry.index?.count || 0;
  }

  const merged = new THREE.BufferGeometry();
  const attributeNames = Object.keys(geometries[0].attributes);
  for (const name of attributeNames) {
    const first = geometries[0].attributes[name];
    const ArrayType = first.array.constructor;
    const array = new ArrayType(
      geometries.reduce((sum, geometry) => sum + geometry.attributes[name].array.length, 0),
    );
    let offset = 0;
    for (let geometryIndex = 0; geometryIndex < geometries.length; geometryIndex += 1) {
      const source = geometries[geometryIndex].attributes[name].array;
      if (name === "position") {
        const matrix = meshes[geometryIndex].matrix.elements;
        for (let item = 0; item < source.length; item += 3) {
          const x = source[item];
          const y = source[item + 1];
          const z = source[item + 2];
          array[offset + item] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
          array[offset + item + 1] =
            matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
          array[offset + item + 2] =
            matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
        }
      } else if (name === "normal") {
        const matrix = normalMatrices[geometryIndex].elements;
        for (let item = 0; item < source.length; item += 3) {
          const x = source[item];
          const y = source[item + 1];
          const z = source[item + 2];
          let normalX = matrix[0] * x + matrix[3] * y + matrix[6] * z;
          let normalY = matrix[1] * x + matrix[4] * y + matrix[7] * z;
          let normalZ = matrix[2] * x + matrix[5] * y + matrix[8] * z;
          const inverseLength = 1 / Math.hypot(normalX, normalY, normalZ);
          normalX *= inverseLength;
          normalY *= inverseLength;
          normalZ *= inverseLength;
          array[offset + item] = normalX;
          array[offset + item + 1] = normalY;
          array[offset + item + 2] = normalZ;
        }
      } else {
        array.set(source, offset);
      }
      offset += source.length;
    }
    merged.setAttribute(
      name,
      new THREE.BufferAttribute(array, first.itemSize, first.normalized),
    );
  }

  const shouldBakeColors = meshes.every(mesh =>
    mesh.userData.mergeMaterial && mesh.userData.mergeColor,
  );
  if (shouldBakeColors && !merged.attributes.color) {
    const colors = new Uint8Array(totalVertices * 3);
    let colorOffset = 0;
    for (let index = 0; index < meshes.length; index += 1) {
      const color = meshes[index].userData.mergeColor;
      const count = geometries[index].attributes.position.count;
      const red = Math.round(THREE.MathUtils.clamp(color.r, 0, 1) * 255);
      const green = Math.round(THREE.MathUtils.clamp(color.g, 0, 1) * 255);
      const blue = Math.round(THREE.MathUtils.clamp(color.b, 0, 1) * 255);
      for (let vertex = 0; vertex < count; vertex += 1) {
        colors[colorOffset] = red;
        colors[colorOffset + 1] = green;
        colors[colorOffset + 2] = blue;
        colorOffset += 3;
      }
    }
    merged.setAttribute("color", new THREE.BufferAttribute(colors, 3, true));
  }

  if (totalIndices > 0) {
    const IndexType = totalVertices > 65535 ? Uint32Array : Uint16Array;
    const index = new IndexType(totalIndices);
    let indexOffset = 0;
    let vertexOffset = 0;
    for (const geometry of geometries) {
      const source = geometry.index.array;
      for (let item = 0; item < source.length; item++) {
        index[indexOffset + item] = source[item] + vertexOffset;
      }
      indexOffset += source.length;
      vertexOffset += geometry.attributes.position.count;
    }
    merged.setIndex(new THREE.BufferAttribute(index, 1));
  }

  merged.computeBoundingSphere();
  return merged;
}

export function mergeRigidMeshes(root, owner, protectedMeshes) {
  const parents = [];
  root.traverse(object => {
    if (object.children.length) parents.push(object);
  });

  for (const parent of parents) {
    const groups = new Map();
    for (const child of parent.children) {
      if (
        !child.isMesh ||
        child.isSkinnedMesh ||
        child.isInstancedMesh ||
        child.children.length ||
        protectedMeshes.has(child) ||
        Array.isArray(child.material) ||
        child.customDepthMaterial ||
        child.customDistanceMaterial
      ) {
        continue;
      }
      const signature = geometryAttributeSignature(child.geometry);
      if (!signature) continue;
      const mergeMaterial = child.userData.mergeMaterial || child.material;
      const key = [
        mergeMaterial.uuid,
        signature,
        child.visible ? 1 : 0,
        child.frustumCulled ? 1 : 0,
        child.renderOrder,
        child.layers.mask,
      ].join("|");
      const group = groups.get(key);
      if (group) group.push(child);
      else groups.set(key, [child]);
    }

    for (const meshes of groups.values()) {
      if (meshes.length < 2) continue;
      const mergedGeometry = owner.geometry(mergeTransformedGeometries(meshes));
      const first = meshes[0];
      const material = first.userData.mergeMaterial || first.material;
      const merged = new THREE.Mesh(mergedGeometry, material);
      merged.name = `${parent.name || "player"}-merged-${first.material.name || first.material.type}`;
      merged.castShadow = meshes.some(mesh => mesh.castShadow);
      merged.receiveShadow = meshes.some(mesh => mesh.receiveShadow);
      merged.visible = first.visible;
      merged.frustumCulled = first.frustumCulled;
      merged.renderOrder = first.renderOrder;
      merged.layers.mask = first.layers.mask;
      merged.userData.sourceNames = meshes.map(mesh => mesh.name).filter(Boolean);
      for (const mesh of meshes) parent.remove(mesh);
      parent.add(merged);
    }
  }

  const retainedGeometries = new Set();
  root.traverse(object => {
    if (object.isMesh && object.geometry) retainedGeometries.add(object.geometry);
  });
  owner.retainGeometries(retainedGeometries);
  const retainedMaterials = new Set();
  root.traverse(object => {
    if (Array.isArray(object.material)) {
      for (const material of object.material) retainedMaterials.add(material);
    } else if (object.material) {
      retainedMaterials.add(object.material);
    }
  });
  owner.retainMaterials(retainedMaterials);
}

function applyPlayerShadowBudget(root, detailMaterials, handParts) {
  root.traverse(object => {
    if (!object.isMesh || !detailMaterials.has(object.material)) return;
    object.castShadow = false;
    object.receiveShadow = false;
  });
  for (const arm of handParts) {
    arm.thumb.castShadow = false;
    arm.thumb.receiveShadow = false;
    for (const finger of arm.fingers) {
      finger.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = false;
        object.receiveShadow = false;
      });
    }
  }
}

function preparePlayerMaterialMerges(root, owner, polishedMaterials, protectedMaterials) {
  const matte = owner.material(new THREE.MeshPhysicalMaterial({
    name: "player-vertex-clay",
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.82,
    metalness: 0,
    clearcoat: 0.035,
    clearcoatRoughness: 0.88,
    sheen: 0.1,
    sheenColor: 0xffffff,
    sheenRoughness: 0.92,
    flatShading: false,
  }));
  const polished = owner.material(new THREE.MeshPhysicalMaterial({
    name: "player-vertex-polished-clay",
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.72,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.78,
    flatShading: false,
  }));
  root.traverse(object => {
    if (
      !object.isMesh ||
      Array.isArray(object.material) ||
      protectedMaterials.has(object.material) ||
      !object.material?.color
    ) {
      return;
    }
    const sourceMaterial = object.material;
    object.userData.mergeColor = sourceMaterial.color;
    object.userData.mergeMaterial = polishedMaterials.has(sourceMaterial) ? polished : matte;
  });
}

function createRoundedClayGeometry({
  width,
  height,
  depth,
  radius,
  topWidth = width,
  bottomWidth = width,
}) {
  const halfHeight = height / 2;
  const topHalf = topWidth / 2;
  const bottomHalf = bottomWidth / 2;
  const corner = Math.min(radius, halfHeight * 0.45, topHalf * 0.45, bottomHalf * 0.45);
  const shape = new THREE.Shape();
  shape.moveTo(-bottomHalf + corner, -halfHeight);
  shape.lineTo(bottomHalf - corner, -halfHeight);
  shape.quadraticCurveTo(bottomHalf, -halfHeight, bottomHalf, -halfHeight + corner);
  shape.lineTo(topHalf, halfHeight - corner);
  shape.quadraticCurveTo(topHalf, halfHeight, topHalf - corner, halfHeight);
  shape.lineTo(-topHalf + corner, halfHeight);
  shape.quadraticCurveTo(-topHalf, halfHeight, -topHalf, halfHeight - corner);
  shape.lineTo(-bottomHalf, -halfHeight + corner);
  shape.quadraticCurveTo(-bottomHalf, -halfHeight, -bottomHalf + corner, -halfHeight);

  const bevel = Math.min(corner * 0.68, depth * 0.38, height * 0.1, width * 0.1);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    curveSegments: 8,
    bevelEnabled: bevel > 0.001,
    bevelSegments: 3,
    bevelSize: bevel,
    bevelThickness: bevel * 0.78,
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function createLoftedClayGeometry(profile, segments = PLAYER_RADIAL_SEGMENTS) {
  const geometry = new THREE.LatheGeometry(
    profile.map(([radius, height]) => new THREE.Vector2(radius, height)),
    segments,
  );
  geometry.computeVertexNormals();
  return geometry;
}

function createEllipticalLoftGeometry(profile, segments = PLAYER_RADIAL_SEGMENTS) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const ringStride = segments + 1;

  for (let ring = 0; ring < profile.length; ring++) {
    const [radiusX, radiusZ, height] = profile[ring];
    for (let segment = 0; segment <= segments; segment++) {
      const progress = segment / segments;
      const angle = progress * Math.PI * 2;
      positions.push(
        Math.cos(angle) * radiusX,
        height,
        Math.sin(angle) * radiusZ,
      );
      uvs.push(progress, ring / (profile.length - 1));
    }
  }

  for (let ring = 0; ring < profile.length - 1; ring++) {
    const current = ring * ringStride;
    const next = current + ringStride;
    for (let segment = 0; segment < segments; segment++) {
      const a = current + segment;
      const b = current + segment + 1;
      const c = next + segment;
      const d = next + segment + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const bottomCenter = positions.length / 3;
  positions.push(0, profile[0][2], 0);
  uvs.push(0.5, 0.5);
  for (let segment = 0; segment < segments; segment++) {
    indices.push(bottomCenter, segment + 1, segment);
  }

  const topCenter = positions.length / 3;
  const topOffset = (profile.length - 1) * ringStride;
  positions.push(0, profile[profile.length - 1][2], 0);
  uvs.push(0.5, 0.5);
  for (let segment = 0; segment < segments; segment++) {
    indices.push(topCenter, topOffset + segment, topOffset + segment + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

function createTaperedClayGeometry({
  length,
  topRadius,
  middleRadius,
  bottomRadius,
  segments = PLAYER_RADIAL_SEGMENTS,
}) {
  const half = length / 2;
  return createLoftedClayGeometry([
    [bottomRadius * 0.78, -half],
    [bottomRadius, -half + length * 0.08],
    [middleRadius, -length * 0.14],
    [middleRadius * 1.03, length * 0.08],
    [topRadius, half - length * 0.08],
    [topRadius * 0.82, half],
  ], segments);
}

function createArmbandTexture(owner) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Captain armband texture could not create a 2D canvas.");
  context.fillStyle = "#f5c451";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#111827";
  context.font = "900 44px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("C", canvas.width / 2, canvas.height / 2 + 2);
  const texture = owner.texture(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createPlayerRig({
  palette,
  seed,
  variant = 0,
  captain = false,
}) {
  const random = seededUnit((seed + variant * 7919) >>> 0);
  const root = new THREE.Group();
  root.name = captain ? "captain-rig" : `teammate-rig-${variant}`;
  const owner = createOwner(root);
  const heightScale = PLAYER_PROPORTIONS.minimumHeightScale +
    random() * (PLAYER_PROPORTIONS.maximumHeightScale - PLAYER_PROPORTIONS.minimumHeightScale);
  const shoulderScale = 0.92 + random() * 0.16;
  const torsoWidthScale = 0.94 + random() * 0.14;
  const torsoDepthScale = 0.92 + random() * 0.14;
  const limbBuildScale = 0.92 + random() * 0.16;
  const headWidthScale = 0.95 + random() * 0.1;
  const headDepthScale = 0.94 + random() * 0.12;
  const headHeightScale = 0.96 + random() * 0.08;
  const stanceBias = (random() - 0.5) * 0.035;
  const shoulderOffset = 0.39 * shoulderScale;
  const appearance = playerAppearanceForVariant(variant);
  const skin = appearance.skinTone;
  const hair = appearance.hairTone;
  const kitVariant = captain ? 0 : variant % 3;

  function createClothMaterial(color, roughness, sheen) {
    return owner.material(new THREE.MeshPhysicalMaterial({
      color,
      roughness,
      metalness: 0,
      sheen,
      sheenColor: color,
      sheenRoughness: 0.88,
      clearcoat: 0.015,
      clearcoatRoughness: 0.92,
      flatShading: false,
    }));
  }

  const primary = createClothMaterial(palette.primary, 0.78, 0.34);
  const secondary = createClothMaterial(palette.secondary, 0.8, 0.3);
  const accent = createClothMaterial(palette.accent, 0.74, 0.38);
  const neutral = createClothMaterial("#eee5d6", 0.84, 0.26);
  const skinMaterial = owner.material(new THREE.MeshPhysicalMaterial({
    color: skin,
    roughness: 0.82,
    metalness: 0,
    clearcoat: 0.045,
    clearcoatRoughness: 0.86,
    sheen: 0.08,
    sheenColor: skin,
    sheenRoughness: 0.94,
    flatShading: false,
  }));
  const hairMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: hair,
    roughness: 0.96,
    metalness: 0,
    flatShading: false,
  }));
  const bootMaterial = owner.material(new THREE.MeshPhysicalMaterial({
    color: "#10141f",
    roughness: 0.66,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.74,
    flatShading: false,
  }));
  const soleMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#05070c",
    roughness: 0.96,
    metalness: 0,
    flatShading: false,
  }));
  const facialMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#201b19",
    roughness: 0.98,
    metalness: 0,
  }));
  const eyeWhiteMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#f4eee5",
    roughness: 0.78,
    metalness: 0,
  }));
  const eyeHighlightMaterial = owner.material(new THREE.MeshBasicMaterial({
    color: "#f7f1e7",
    toneMapped: false,
  }));

  const jerseyMaterial = kitVariant === 2 ? neutral : primary;
  const shortsMaterial = kitVariant === 1 ? neutral : secondary;
  const sockMaterial = kitVariant === 2 ? primary : neutral;
  const trimMaterial = kitVariant === 2 ? primary : accent;

  const torsoGeometry = owner.geometry(
    createEllipticalLoftGeometry([
      [0.215, 0.155, -0.44],
      [0.245, 0.175, -0.39],
      [0.275, 0.19, -0.28],
      [0.3, 0.205, -0.1],
      [0.33, 0.225, 0.1],
      [0.37, 0.24, 0.28],
      [0.405, 0.245, 0.39],
      [0.365, 0.225, 0.46],
      [0.255, 0.18, 0.49],
    ]),
  );
  const shoulderYokeGeometry = owner.geometry(
    createEllipticalLoftGeometry([
      [0.255, 0.17, -0.12],
      [0.38, 0.215, -0.05],
      [0.445, 0.235, 0.02],
      [0.41, 0.225, 0.1],
      [0.29, 0.18, 0.15],
    ]),
  );
  const sidePanelGeometry = owner.geometry(
    new THREE.CapsuleGeometry(0.014, 0.46, 6, 12),
  );
  const pelvisGeometry = owner.geometry(
    createEllipticalLoftGeometry([
      [0.205, 0.145, -0.16],
      [0.235, 0.17, -0.125],
      [0.26, 0.19, -0.055],
      [0.27, 0.2, 0.045],
      [0.255, 0.185, 0.12],
      [0.215, 0.15, 0.16],
    ]),
  );
  const jerseyHemGeometry = owner.geometry(
    createEllipticalLoftGeometry([
      [0.225, 0.16, -0.035],
      [0.25, 0.18, 0],
      [0.225, 0.16, 0.035],
    ]),
  );
  const shortsWaistGeometry = owner.geometry(
    createEllipticalLoftGeometry([
      [0.225, 0.155, -0.03],
      [0.265, 0.19, 0],
      [0.225, 0.155, 0.03],
    ]),
  );
  const upperArmGeometry = owner.geometry(
    createTaperedClayGeometry({
      length: PLAYER_PROPORTIONS.upperArmLength,
      topRadius: 0.112,
      middleRadius: 0.098,
      bottomRadius: 0.08,
    }),
  );
  const forearmGeometry = owner.geometry(
    createTaperedClayGeometry({
      length: PLAYER_PROPORTIONS.forearmLength,
      topRadius: 0.082,
      middleRadius: 0.076,
      bottomRadius: 0.062,
    }),
  );
  const deltoidGeometry = owner.geometry(
    new THREE.SphereGeometry(0.145, PLAYER_RADIAL_SEGMENTS, 20),
  );
  const thighGeometry = owner.geometry(
    createTaperedClayGeometry({
      length: 0.6,
      topRadius: 0.136,
      middleRadius: 0.12,
      bottomRadius: 0.09,
    }),
  );
  const shinGeometry = owner.geometry(
    createTaperedClayGeometry({
      length: 0.56,
      topRadius: 0.084,
      middleRadius: 0.074,
      bottomRadius: 0.062,
    }),
  );
  const sleeveGeometry = owner.geometry(
    createTaperedClayGeometry({
      length: 0.22,
      topRadius: 0.136,
      middleRadius: 0.126,
      bottomRadius: 0.103,
    }),
  );
  const sleeveCuffGeometry = owner.geometry(
    new THREE.CylinderGeometry(0.108, 0.112, 0.04, PLAYER_RADIAL_SEGMENTS, 1, true),
  );
  const shortsCuffGeometry = owner.geometry(
    createTaperedClayGeometry({
      length: 0.18,
      topRadius: 0.135,
      middleRadius: 0.128,
      bottomRadius: 0.105,
    }),
  );
  const jointGeometry = owner.geometry(
    new THREE.SphereGeometry(0.085, PLAYER_RADIAL_SEGMENTS, 18),
  );
  const handGeometry = owner.geometry(
    new THREE.SphereGeometry(0.108, 28, 18),
  );
  const knuckleGeometry = owner.geometry(new THREE.SphereGeometry(0.075, 20, 14));
  const fingerGeometry = owner.geometry(
    new THREE.CapsuleGeometry(0.02, 0.078, 8, 14),
  );
  const thumbGeometry = owner.geometry(
    new THREE.CapsuleGeometry(0.026, 0.065, 8, 14),
  );
  const neckGeometry = owner.geometry(
    new THREE.CapsuleGeometry(0.095, 0.055, PLAYER_CAP_SEGMENTS, PLAYER_RADIAL_SEGMENTS),
  );
  const headGeometry = owner.geometry(
    createEllipticalLoftGeometry([
      [0.105, 0.12, -0.2],
      [0.175, 0.175, -0.165],
      [0.215, 0.205, -0.07],
      [0.232, 0.218, 0.075],
      [0.225, 0.21, 0.2],
      [0.19, 0.19, 0.29],
      [0.12, 0.14, 0.34],
    ], PLAYER_HEAD_SEGMENTS),
  );
  const hairGeometry = owner.geometry(
    new THREE.SphereGeometry(
      1,
      PLAYER_HEAD_SEGMENTS,
      24,
      0,
      Math.PI * 2,
      0,
      1.18,
    ),
  );
  const hairClumpGeometry = owner.geometry(new THREE.SphereGeometry(0.056, 22, 16));
  const hairLockGeometry = owner.geometry(
    new THREE.CapsuleGeometry(0.032, 0.1, 8, 16),
  );
  const earGeometry = owner.geometry(new THREE.SphereGeometry(0.043, 20, 14));
  const eyeGeometry = owner.geometry(new THREE.SphereGeometry(0.028, 20, 14));
  const pupilGeometry = owner.geometry(new THREE.SphereGeometry(0.012, 16, 10));
  const eyeHighlightGeometry = owner.geometry(new THREE.SphereGeometry(0.005, 8, 6));
  const browGeometry = owner.geometry(
    new THREE.CapsuleGeometry(0.006, 0.05, 6, 12),
  );
  const noseGeometry = owner.geometry(new THREE.SphereGeometry(0.05, 22, 16));
  const mouthGeometry = owner.geometry(new THREE.TorusGeometry(0.042, 0.006, 8, 20, Math.PI));
  const moustacheGeometry = owner.geometry(
    new THREE.CapsuleGeometry(0.009, 0.052, 6, 12),
  );
  const goateeGeometry = owner.geometry(
    new THREE.CapsuleGeometry(0.018, 0.055, 8, 14),
  );
  const beardStrandGeometry = owner.geometry(
    new THREE.CapsuleGeometry(0.018, 0.105, 8, 14),
  );
  const beardPatchGeometry = owner.geometry(new THREE.SphereGeometry(0.055, 18, 12));
  const collarGeometry = owner.geometry(
    new THREE.TorusGeometry(0.105, 0.014, 10, PLAYER_RADIAL_SEGMENTS),
  );
  const crestGeometry = owner.geometry(new THREE.SphereGeometry(0.052, 18, 12));
  const bootUpperGeometry = owner.geometry(createRoundedClayGeometry({
    width: 0.25,
    height: 0.15,
    depth: 0.39,
    radius: 0.055,
    topWidth: 0.205,
    bottomWidth: 0.25,
  }));
  const bootToeGeometry = owner.geometry(new THREE.SphereGeometry(0.13, 28, 18));
  const bootTongueGeometry = owner.geometry(createRoundedClayGeometry({
    width: 0.12,
    height: 0.035,
    depth: 0.2,
    radius: 0.018,
    topWidth: 0.09,
    bottomWidth: 0.12,
  }));
  const soleGeometry = owner.geometry(createRoundedClayGeometry({
    width: 0.27,
    height: 0.055,
    depth: 0.44,
    radius: 0.025,
  }));

  const scalpCenterY = 0.105;
  const scalpRadiusX = 0.225;
  const scalpRadiusY = 0.285;
  const scalpRadiusZ = 0.225;

  function scalpSurfaceY(x, z) {
    const normalized =
      (x * x) / (scalpRadiusX * scalpRadiusX) +
      (z * z) / (scalpRadiusZ * scalpRadiusZ);
    return scalpCenterY + scalpRadiusY * Math.sqrt(Math.max(0.08, 1 - normalized));
  }

  function addHairStyle(head) {
    const style = appearance.hairStyle;
    const shellScaleY = [0.96, 1.02, 0.76, 0.9, 0.94, 0.62, 0.82][style];
    const cap = addMesh(
      head,
      hairGeometry,
      hairMaterial,
      [0, scalpCenterY - (1 - shellScaleY) * 0.025, 0],
      [scalpRadiusX * 0.985, scalpRadiusY * shellScaleY, scalpRadiusZ * 0.985],
    );
    cap.name = "fitted-hair-shell";

    if (style === 0) {
      const curls = [
        [-0.14, 0.015, 0.94],
        [-0.075, 0.075, 1.04],
        [0, 0.095, 1.12],
        [0.075, 0.075, 1.04],
        [0.14, 0.015, 0.94],
        [-0.1, -0.07, 0.96],
        [0, -0.105, 1.02],
        [0.1, -0.07, 0.96],
      ];
      curls.forEach(([x, z, scale], index) => {
        const clump = addMesh(
          head,
          hairClumpGeometry,
          hairMaterial,
          [x, scalpSurfaceY(x, z) - 0.012, z],
          [scale, 0.88 + (index % 2) * 0.1, scale * 0.92],
        );
        clump.name = `sculpted-hair-clump-${index + 1}`;
      });
      return;
    }

    if (style === 1) {
      const coils = [
        [-0.105, 0.02],
        [-0.035, 0.055],
        [0.035, 0.055],
        [0.105, 0.02],
        [-0.075, -0.04],
        [0, -0.02],
        [0.075, -0.04],
      ];
      coils.forEach(([x, z], index) => {
        const clump = addMesh(
          head,
          hairClumpGeometry,
          hairMaterial,
          [x, scalpSurfaceY(x, z) - 0.006, z],
          [1.02, 1.18 + (index % 3) * 0.08, 0.94],
        );
        clump.name = `sculpted-hair-clump-${index + 1}`;
      });
      return;
    }

    if (style === 2) {
      [-0.13, -0.065, 0, 0.065, 0.13].forEach((x, index) => {
        const z = 0.085 - Math.abs(x) * 0.16;
        const clump = addMesh(
          head,
          hairClumpGeometry,
          hairMaterial,
          [x, scalpSurfaceY(x, z) - 0.032, z],
          [0.92, 0.38, 0.76],
        );
        clump.name = `sculpted-hair-clump-${index + 1}`;
      });
      return;
    }

    if (style === 3) {
      for (let index = 0; index < 5; index++) {
        const x = -0.13 + index * 0.065;
        const z = 0.045 - index * 0.012;
        const lock = addMesh(
          head,
          hairLockGeometry,
          hairMaterial,
          [x, scalpSurfaceY(x, z) - 0.035, z],
          [1, 0.92 + index * 0.055, 0.9],
        );
        lock.rotation.z = -0.48 + index * 0.14;
        lock.name = `sculpted-hair-clump-${index + 1}`;
      }
      return;
    }

    if (style === 4) {
      const quiff = [
        [-0.11, 0.09, 0.86, -0.2],
        [-0.045, 0.12, 1.04, -0.08],
        [0.025, 0.125, 1.14, 0.06],
        [0.09, 0.09, 0.98, 0.18],
      ];
      quiff.forEach(([x, z, scale, rotation], index) => {
        const lock = addMesh(
          head,
          hairLockGeometry,
          hairMaterial,
          [x, scalpSurfaceY(x, z) - 0.025, z],
          [1.06, scale, 0.96],
        );
        lock.rotation.z = rotation;
        lock.rotation.x = 0.16;
        lock.name = `sculpted-hair-clump-${index + 1}`;
      });
      return;
    }

    if (style === 5) {
      for (let index = 0; index < 6; index++) {
        const z = -0.1 + index * 0.044;
        const clump = addMesh(
          head,
          hairClumpGeometry,
          hairMaterial,
          [0, scalpSurfaceY(0, z) - 0.01, z],
          [0.72, 0.9 + (index % 2) * 0.12, 0.7],
        );
        clump.name = `sculpted-hair-clump-${index + 1}`;
      }
      return;
    }

    const shortLocs = [
      [-0.14, 0.045, -0.28],
      [-0.09, 0.105, -0.18],
      [-0.03, 0.13, -0.06],
      [0.04, 0.13, 0.08],
      [0.105, 0.095, 0.2],
      [0.145, 0.035, 0.3],
      [-0.08, -0.045, -0.2],
      [0.08, -0.045, 0.2],
    ];
    shortLocs.forEach(([x, z, rotation], index) => {
      const lock = addMesh(
        head,
        hairLockGeometry,
        hairMaterial,
        [x, scalpSurfaceY(x, z) - 0.035, z],
        [0.88, 1.12 + (index % 3) * 0.08, 0.86],
      );
      lock.rotation.x = 0.12;
      lock.rotation.z = rotation;
      lock.name = `sculpted-hair-clump-${index + 1}`;
    });
  }

  function addMoustache(head) {
    for (const side of [-1, 1]) {
      const whisker = addMesh(
        head,
        moustacheGeometry,
        hairMaterial,
        [side * 0.027, 0.018, 0.231 * headDepthScale],
        [1, 0.78, 0.62],
      );
      whisker.rotation.z = Math.PI / 2 + side * 0.13;
      whisker.name = `facial-hair-moustache-${side < 0 ? "left" : "right"}`;
    }
  }

  function addFacialHair(head) {
    const style = appearance.facialHairStyle;
    if (style === 0) return;
    if (style <= 3) addMoustache(head);
    if (style === 1) return;

    if (style === 2) {
      const goatee = addMesh(
        head,
        goateeGeometry,
        hairMaterial,
        [0, -0.064, 0.226 * headDepthScale],
        [0.82, 0.96, 0.62],
      );
      goatee.name = "facial-hair-goatee";
      return;
    }

    if (style === 3) {
      for (const side of [-1, 1]) {
        const jaw = addMesh(
          head,
          beardStrandGeometry,
          hairMaterial,
          [side * 0.105, -0.048, 0.215 * headDepthScale],
          [0.88, 1.08, 0.58],
        );
        jaw.rotation.z = side * 0.48;
        jaw.name = `facial-hair-jaw-${side < 0 ? "left" : "right"}`;
      }
    } else {
      for (const side of [-1, 1]) {
        const sideburn = addMesh(
          head,
          goateeGeometry,
          hairMaterial,
          [side * 0.178 * headWidthScale, 0.018, 0.18 * headDepthScale],
          [0.65, 1.08, 0.54],
        );
        sideburn.name = `facial-hair-sideburn-${side < 0 ? "left" : "right"}`;
      }
    }

    const chin = addMesh(
      head,
      beardPatchGeometry,
      hairMaterial,
      [0, -0.095, 0.216 * headDepthScale],
      [1.05, 0.76, 0.58],
    );
    chin.name = "facial-hair-chin-patch";
  }

  const body = new THREE.Group();
  body.name = "player-body";
  root.add(body);

  const hips = new THREE.Group();
  hips.name = "hips";
  hips.position.y = 1.22;
  body.add(hips);
  const pelvis = addMesh(
    hips,
    pelvisGeometry,
    shortsMaterial,
    [0, 0, 0],
    [torsoWidthScale, 1, torsoDepthScale],
  );
  pelvis.name = "anatomical-avatar-pelvis";
  const shortsWaist = addMesh(
    hips,
    shortsWaistGeometry,
    trimMaterial,
    [0, 0.115, 0],
    [torsoWidthScale, 1, torsoDepthScale],
  );
  shortsWaist.name = "shorts-waistband";
  addMesh(
    hips,
    shortsCuffGeometry,
    shortsMaterial,
    [-0.16, -0.16, 0],
    [limbBuildScale, 1, limbBuildScale * 0.9],
  );
  addMesh(
    hips,
    shortsCuffGeometry,
    shortsMaterial,
    [0.16, -0.16, 0],
    [limbBuildScale, 1, limbBuildScale * 0.9],
  );
  const shortsSeam = addMesh(
    hips,
    sidePanelGeometry,
    trimMaterial,
    [0, -0.025, 0.195 * torsoDepthScale],
    [0.72, 0.42, 0.7],
  );
  shortsSeam.name = "shorts-front-seam";

  const chest = new THREE.Group();
  chest.name = "chest";
  chest.position.y = 0.34;
  hips.add(chest);
  const shoulderYoke = addMesh(
    chest,
    shoulderYokeGeometry,
    jerseyMaterial,
    [0, 0.39, 0],
    [shoulderScale * torsoWidthScale, 1, torsoDepthScale],
  );
  shoulderYoke.name = "organic-jersey-yoke";
  const torso = addMesh(
    chest,
    torsoGeometry,
    jerseyMaterial,
    [0, 0.08, 0],
    [shoulderScale * torsoWidthScale, 1, torsoDepthScale],
  );
  torso.name = "anatomical-avatar-torso";
  const jerseyHem = addMesh(
    chest,
    jerseyHemGeometry,
    trimMaterial,
    [0, -0.335, 0],
    [shoulderScale * torsoWidthScale, 1, torsoDepthScale],
  );
  jerseyHem.name = "jersey-sculpted-hem";
  addMesh(chest, sidePanelGeometry, trimMaterial, [-0.3 * shoulderScale, 0.18, 0.16]);
  addMesh(chest, sidePanelGeometry, trimMaterial, [0.3 * shoulderScale, 0.18, 0.16]);
  const collar = addMesh(chest, collarGeometry, shortsMaterial, [0, 0.54, 0]);
  collar.rotation.x = Math.PI / 2;
  collar.name = "jersey-collar";
  const crest = addMesh(chest, crestGeometry, trimMaterial, [-0.13, 0.32, 0.24], [0.62, 0.78, 0.24]);
  crest.name = "jersey-crest";

  const neck = new THREE.Group();
  neck.name = "neck";
  neck.position.y = 0.64;
  chest.add(neck);
  addMesh(neck, neckGeometry, skinMaterial, [0, 0.07, 0]);

  const head = new THREE.Group();
  head.name = "head";
  head.position.y = 0.21;
  neck.add(head);
  const face = addMesh(
    head,
    headGeometry,
    skinMaterial,
    [0, 0.03, 0],
    [headWidthScale, headHeightScale, headDepthScale],
  );
  face.name = "clay-avatar-face";
  addHairStyle(head);
  addMesh(
    head,
    earGeometry,
    skinMaterial,
    [-0.215 * headWidthScale, 0.085, 0],
    [0.85, 1, 0.78],
  );
  addMesh(
    head,
    earGeometry,
    skinMaterial,
    [0.215 * headWidthScale, 0.085, 0],
    [0.85, 1, 0.78],
  );
  const nose = addMesh(
    head,
    noseGeometry,
    skinMaterial,
    [0, 0.055, 0.218 * headDepthScale],
    [0.48, 0.72, 0.7],
  );
  nose.name = "player-nose";
  for (const side of [-1, 1]) {
    addMesh(
      head,
      eyeGeometry,
      eyeWhiteMaterial,
      [side * 0.07, 0.125, 0.214 * headDepthScale],
      [1.04, 0.72, 0.44],
    );
    addMesh(
      head,
      pupilGeometry,
      facialMaterial,
      [side * 0.07, 0.124, 0.231 * headDepthScale],
      [0.9, 1, 0.48],
    );
    addMesh(
      head,
      eyeHighlightGeometry,
      eyeHighlightMaterial,
      [side * 0.067, 0.13, 0.238 * headDepthScale],
    );
    const brow = addMesh(
      head,
      browGeometry,
      hairMaterial,
      [side * 0.072, 0.177, 0.224 * headDepthScale],
    );
    brow.rotation.z = Math.PI / 2 + side * 0.08;
  }
  addFacialHair(head);
  const mouth = addMesh(
    head,
    mouthGeometry,
    facialMaterial,
    [0, -0.005, 0.222 * headDepthScale],
    [1, 0.72, 1],
  );
  mouth.rotation.z = Math.PI;
  mouth.name = "soft-avatar-smile";

  function createArm(name, x) {
    const side = x < 0 ? -1 : 1;
    const shoulder = new THREE.Group();
    shoulder.name = `${name}Shoulder`;
    shoulder.position.set(x, 0.52, 0);
    chest.add(shoulder);
    const deltoid = addMesh(
      shoulder,
      deltoidGeometry,
      jerseyMaterial,
      [0, -0.035, 0],
      [1.05 * limbBuildScale, 0.92, 0.95 * limbBuildScale],
    );
    deltoid.name = `${name}-sculpted-deltoid`;
    addMesh(
      shoulder,
      upperArmGeometry,
      skinMaterial,
      [0, -0.29, 0],
      [limbBuildScale, 1, limbBuildScale],
    );
    addMesh(
      shoulder,
      sleeveGeometry,
      jerseyMaterial,
      [0, -0.11, 0],
      [1.08 * limbBuildScale, 1.06, limbBuildScale],
    );
    const sleeveCuff = addMesh(
      shoulder,
      sleeveCuffGeometry,
      trimMaterial,
      [0, -0.215, 0],
      [limbBuildScale, 1, limbBuildScale],
    );
    sleeveCuff.name = `${name}-sleeve-cuff`;

    const elbow = new THREE.Group();
    elbow.name = `${name}Elbow`;
    elbow.position.y = -PLAYER_PROPORTIONS.upperArmLength;
    shoulder.add(elbow);
    addMesh(
      elbow,
      jointGeometry,
      skinMaterial,
      [0, 0, 0],
      [0.82 * limbBuildScale, 0.72, 0.82 * limbBuildScale],
    );
    addMesh(
      elbow,
      forearmGeometry,
      skinMaterial,
      [0, -0.28, 0],
      [limbBuildScale, 1, limbBuildScale],
    );

    const hand = new THREE.Group();
    hand.name = `${name}Hand`;
    hand.position.y = -PLAYER_PROPORTIONS.forearmLength;
    elbow.add(hand);
    const palm = addMesh(
      hand,
      handGeometry,
      skinMaterial,
      [0, -0.025, 0.01],
      [0.8 * limbBuildScale, 0.98, 0.62 * limbBuildScale],
    );
    palm.name = `${name}-palm`;
    const knuckles = addMesh(
      hand,
      knuckleGeometry,
      skinMaterial,
      [0, -0.08, 0.035],
      [0.95 * limbBuildScale, 0.42, 0.62 * limbBuildScale],
    );
    knuckles.name = `${name}-knuckles`;
    const fingers = Array.from({ length: PLAYER_FINGER_COUNT }, (_, index) => {
      const normalized = PLAYER_FINGER_COUNT === 1
        ? 0
        : index / (PLAYER_FINGER_COUNT - 1) - 0.5;
      const finger = new THREE.Group();
      finger.name = `${name}-finger-${index + 1}`;
      finger.position.set(normalized * 0.105, -0.098, 0.015);
      finger.rotation.z = -normalized * 0.08;
      hand.add(finger);
      addMesh(finger, fingerGeometry, skinMaterial, [0, -0.06, 0]);
      return finger;
    });
    const thumb = addMesh(
      hand,
      thumbGeometry,
      skinMaterial,
      [-side * 0.085, -0.035, 0.03],
      [1, 1, 0.9],
    );
    thumb.rotation.z = side * 0.62;
    thumb.name = `${name}-thumb`;
    return { shoulder, elbow, hand, fingers, thumb, side };
  }

  // The player faces +Z, so anatomical right is viewer-left at the final camera.
  const rightArm = createArm("right", -shoulderOffset);
  const leftArm = createArm("left", shoulderOffset);

  if (captain) {
    const bandGeometry = owner.geometry(
      new THREE.CylinderGeometry(0.132, 0.132, 0.145, PLAYER_RADIAL_SEGMENTS, 1, true),
    );
    const bandMaterial = owner.material(new THREE.MeshStandardMaterial({
      color: "#f5c451",
      roughness: 0.72,
      side: THREE.DoubleSide,
    }));
    const band = addMesh(rightArm.shoulder, bandGeometry, bandMaterial, [0, -0.19, 0]);
    band.name = "captain-right-arm-band";

    const badgeMaterial = owner.material(new THREE.SpriteMaterial({
      map: createArmbandTexture(owner),
      transparent: true,
      depthTest: true,
    }));
    const badge = new THREE.Sprite(badgeMaterial);
    badge.position.set(0, -0.19, 0.145);
    badge.scale.set(0.22, 0.11, 1);
    badge.name = "captain-right-arm-c";
    rightArm.shoulder.add(badge);
  }

  function createLeg(name, x) {
    const hip = new THREE.Group();
    hip.name = `${name}Hip`;
    hip.position.x = x;
    hips.add(hip);
    addMesh(
      hip,
      thighGeometry,
      shortsMaterial,
      [0, -0.3, 0],
      [limbBuildScale, 1, limbBuildScale],
    );

    const knee = new THREE.Group();
    knee.name = `${name}Knee`;
    knee.position.y = -0.6;
    hip.add(knee);
    addMesh(
      knee,
      jointGeometry,
      skinMaterial,
      [0, 0, 0],
      [0.86 * limbBuildScale, 0.76, 0.86 * limbBuildScale],
    );
    addMesh(
      knee,
      shinGeometry,
      sockMaterial,
      [0, -0.28, 0],
      [limbBuildScale, 1, limbBuildScale],
    );
    const sockCuff = addMesh(
      knee,
      sleeveCuffGeometry,
      trimMaterial,
      [0, -0.075, 0],
      [0.82 * limbBuildScale, 0.92, 0.82 * limbBuildScale],
    );
    sockCuff.name = `${name}-sock-cuff`;

    const foot = new THREE.Group();
    foot.name = `${name}Foot`;
    foot.position.y = -0.56;
    knee.add(foot);
    const bootUpper = addMesh(
      foot,
      bootUpperGeometry,
      bootMaterial,
      [0, -0.01, 0.14],
      [0.94 * limbBuildScale, 1, 1.04],
    );
    bootUpper.name = `${name}-boot-upper`;
    const bootToe = addMesh(
      foot,
      bootToeGeometry,
      bootMaterial,
      [0, -0.01, 0.31],
      [0.94 * limbBuildScale, 0.55, 1.05],
    );
    bootToe.name = `${name}-boot-toe`;
    const bootTongue = addMesh(
      foot,
      bootTongueGeometry,
      trimMaterial,
      [0, 0.075, 0.12],
      [0.9 * limbBuildScale, 1, 1],
    );
    bootTongue.rotation.x = -0.18;
    bootTongue.name = `${name}-boot-tongue`;
    const sole = addMesh(foot, soleGeometry, soleMaterial, [0, -0.105, 0.16]);
    sole.name = "boot-sole";
    return { hip, knee, foot };
  }

  const rightLeg = createLeg("right", -0.16);
  const leftLeg = createLeg("left", 0.16);

  const trophyCarrier = new THREE.Object3D();
  trophyCarrier.name = "trophyCarrier";
  trophyCarrier.position.set(0, STAGE_HEIGHTS.trophyCarry, 0.52);
  root.add(trophyCarrier);

  const joints = {
    hips,
    chest,
    neck,
    head,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    leftHand: leftArm.hand,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    rightHand: rightArm.hand,
    leftHip: leftLeg.hip,
    leftKnee: leftLeg.knee,
    leftFoot: leftLeg.foot,
    rightHip: rightLeg.hip,
    rightKnee: rightLeg.knee,
    rightFoot: rightLeg.foot,
  };
  const anchors = {
    leftHand: leftArm.hand,
    rightHand: rightArm.hand,
    trophyCarrier,
    trophyGrip: trophyCarrier,
    leftFoot: leftLeg.foot,
    rightFoot: rightLeg.foot,
  };
  const jointList = Object.values(joints);
  const handParts = [leftArm, rightArm];
  applyPlayerShadowBudget(
    root,
    new Set([trimMaterial, facialMaterial, eyeWhiteMaterial, eyeHighlightMaterial]),
    handParts,
  );
  preparePlayerMaterialMerges(
    root,
    owner,
    new Set([bootMaterial, soleMaterial]),
    new Set([eyeHighlightMaterial]),
  );
  mergeRigidMeshes(root, owner, new Set([leftArm.thumb, rightArm.thumb]));

  function setArmGrip(arm, amount) {
    const grip = Math.min(1, Math.max(0, amount));
    arm.fingers.forEach((finger, index) => {
      finger.rotation.x = -grip * (0.88 + index * 0.06);
    });
    arm.thumb.rotation.x = -grip * 0.64;
    arm.thumb.rotation.z = arm.side * (0.62 - grip * 0.22);
  }

  function setHandGrip(amount = 0) {
    for (const arm of handParts) setArmGrip(arm, amount);
  }

  function setRightHandGrip(amount = 0) {
    setArmGrip(rightArm, amount);
  }

  function resetPose() {
    for (const joint of jointList) joint.rotation.set(0, 0, 0);
    hips.position.y = 1.22;
    chest.position.y = 0.34;
    head.position.set(0, 0.21, 0);
    leftArm.shoulder.rotation.z = 0.075 + stanceBias;
    rightArm.shoulder.rotation.z = -0.075 + stanceBias;
    leftArm.elbow.rotation.x = -0.08;
    rightArm.elbow.rotation.x = -0.08;
    leftArm.hand.rotation.z = 0.035;
    rightArm.hand.rotation.z = -0.035;
    chest.rotation.y = stanceBias;
    head.rotation.y = -stanceBias * 0.55;
    root.position.y = STAGE_HEIGHTS.playerFoot;
    body.scale.setScalar(heightScale);
    trophyCarrier.position.set(0, STAGE_HEIGHTS.trophyCarry, 0.52);
    setHandGrip(0.08);
  }

  resetPose();
  return {
    root,
    joints,
    anchors,
    arms: {
      left: leftArm,
      right: rightArm,
    },
    metrics: {
      heightScale,
      shoulderHeight: PLAYER_PROPORTIONS.shoulderHeight * heightScale,
      shoulderOffset: shoulderOffset * heightScale,
      upperArmLength: PLAYER_PROPORTIONS.upperArmLength * heightScale,
      forearmLength: PLAYER_PROPORTIONS.forearmLength * heightScale,
    },
    setHandGrip,
    setRightHandGrip,
    resetPose,
    dispose: owner.dispose,
  };
}

function createPitchTexture(owner) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Champion pitch texture could not create a 2D canvas.");

  context.fillStyle = "#3d844d";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let stripe = 0; stripe < 10; stripe++) {
    context.fillStyle = stripe % 2 ? "#4b9258" : "#377a48";
    context.fillRect(stripe * canvas.width / 10, 0, canvas.width / 10 + 1, canvas.height);
  }
  for (let blade = 0; blade < 320; blade++) {
    const x = (blade * 83) % canvas.width;
    const y = (blade * 47) % canvas.height;
    context.fillStyle = blade % 3 === 0 ? "#2f6f42" : "#5b9f61";
    context.fillRect(x, y, 1, 3);
  }

  const texture = owner.texture(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createChampionBannerTexture(owner, { palette, team }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Champion banner texture could not create a 2D canvas.");

  context.fillStyle = "#1b1518";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = palette.primary;
  context.fillRect(0, 0, canvas.width, 14);
  context.fillStyle = palette.secondary;
  context.fillRect(0, canvas.height - 14, canvas.width, 14);
  context.strokeStyle = palette.accent;
  context.lineWidth = 5;
  context.strokeRect(20, 24, canvas.width - 40, canvas.height - 48);

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#fff1dc";
  context.font = '800 54px "Segoe UI", Arial, sans-serif';
  context.fillText("2026 WORLD CUP CHAMPIONS", canvas.width / 2, 88);

  const label = String(team || "CHAMPIONS").toUpperCase();
  let fontSize = 82;
  do {
    context.font = `900 ${fontSize}px "Segoe UI", Arial, sans-serif`;
    fontSize -= 4;
  } while (fontSize > 42 && context.measureText(label).width > canvas.width - 110);
  context.lineJoin = "round";
  context.lineWidth = 9;
  context.strokeStyle = palette.accent;
  context.strokeText(label, canvas.width / 2, 174, canvas.width - 110);
  context.fillStyle = "#fff1dc";
  context.fillText(label, canvas.width / 2, 174, canvas.width - 110);

  const texture = owner.texture(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createTrophyPlinth({ palette }) {
  const root = new THREE.Group();
  root.name = "storyboard-trophy-plinth";
  const owner = createOwner(root);
  const body = owner.material(new THREE.MeshStandardMaterial({
    color: "#eee5d6",
    roughness: 0.94,
    metalness: 0,
    flatShading: false,
  }));
  const side = owner.material(new THREE.MeshStandardMaterial({
    color: "#d8cbb8",
    roughness: 0.95,
    metalness: 0,
    flatShading: false,
  }));
  const trim = owner.material(new THREE.MeshStandardMaterial({
    color: palette.primary,
    roughness: 0.9,
    metalness: 0.01,
    flatShading: false,
  }));

  const base = addMesh(
    root,
    owner.geometry(createRoundedClayGeometry({
      width: 1.45,
      height: 0.16,
      depth: 1.35,
      radius: 0.12,
    })),
    side,
    [0, 0.08, 0],
  );
  base.name = "plinth-base";
  const column = addMesh(
    root,
    owner.geometry(createRoundedClayGeometry({
      width: 1.08,
      height: 0.88,
      depth: 1.05,
      radius: 0.14,
    })),
    body,
    [0, 0.56, 0],
  );
  column.name = "plinth-column";
  const slab = addMesh(
    root,
    owner.geometry(createRoundedClayGeometry({
      width: 1.3,
      height: 0.12,
      depth: 1.2,
      radius: 0.09,
    })),
    body,
    [0, 1.06, 0],
  );
  slab.name = "plinth-top-slab";
  const inset = addMesh(
    root,
    owner.geometry(createRoundedClayGeometry({
      width: 0.52,
      height: 0.18,
      depth: 0.05,
      radius: 0.035,
    })),
    trim,
    [0, 0.68, 0.55],
  );
  inset.name = "plinth-country-inset";

  const top = new THREE.Object3D();
  top.name = "plinth-top-anchor";
  top.position.set(0, STAGE_HEIGHTS.plinthTop, 0);
  root.add(top);

  return {
    root,
    anchors: { top },
    materials: [body, side, trim],
    dispose: owner.dispose,
  };
}

export function createPodium({ palette }) {
  const root = new THREE.Group();
  root.name = "storyboard-winners-podium";
  const owner = createOwner(root);
  const ivory = owner.material(new THREE.MeshStandardMaterial({
    color: "#eee7db",
    roughness: 0.94,
    metalness: 0,
    flatShading: false,
  }));
  const shadow = owner.material(new THREE.MeshStandardMaterial({
    color: "#d5c8b7",
    roughness: 0.96,
    metalness: 0,
    flatShading: false,
  }));
  const trim = owner.material(new THREE.MeshStandardMaterial({
    color: palette.primary,
    roughness: 0.9,
    metalness: 0.01,
    flatShading: false,
  }));

  const baseGeometry = owner.geometry(createRoundedClayGeometry({
    width: 8.4,
    height: 0.22,
    depth: 3,
    radius: 0.2,
  }));
  const rearGeometry = owner.geometry(createRoundedClayGeometry({
    width: 7.4,
    height: 0.28,
    depth: 2.25,
    radius: 0.18,
  }));
  const teamDeckGeometry = owner.geometry(createRoundedClayGeometry({
    width: 6.7,
    height: 0.3,
    depth: 1.75,
    radius: 0.16,
  }));
  const lowStepGeometry = owner.geometry(createRoundedClayGeometry({
    width: 1.15,
    height: 0.18,
    depth: 2.35,
    radius: 0.12,
  }));
  const middleStepGeometry = owner.geometry(createRoundedClayGeometry({
    width: 1.05,
    height: 0.18,
    depth: 1.85,
    radius: 0.11,
  }));
  const highStepGeometry = owner.geometry(createRoundedClayGeometry({
    width: 0.95,
    height: 0.18,
    depth: 1.35,
    radius: 0.1,
  }));
  const captainDrumGeometry = owner.geometry(
    new THREE.CylinderGeometry(1.2, 1.28, STAGE_HEIGHTS.captainPodiumTop, 64),
  );
  const insetGeometry = owner.geometry(createRoundedClayGeometry({
    width: 2.2,
    height: 0.16,
    depth: 0.08,
    radius: 0.05,
  }));
  const sideInsetGeometry = owner.geometry(createRoundedClayGeometry({
    width: 0.72,
    height: 0.12,
    depth: 0.07,
    radius: 0.04,
  }));

  const base = addMesh(root, baseGeometry, shadow, [0, 0.11, 0.1]);
  base.name = "podium-foundation";
  const rear = addMesh(root, rearGeometry, ivory, [0, 0.34, -0.15]);
  rear.name = "rear-team-platform";
  const teamDeck = addMesh(root, teamDeckGeometry, ivory, [0, 0.57, -0.28]);
  teamDeck.name = "rear-team-deck";
  for (const sideSign of [-1, 1]) {
    const sideName = sideSign < 0 ? "left" : "right";
    const lowStep = addMesh(root, lowStepGeometry, ivory, [sideSign * 3.55, 0.09, 0.35]);
    const middleStep = addMesh(
      root,
      middleStepGeometry,
      ivory,
      [sideSign * 3.35, 0.27, 0.22],
    );
    const highStep = addMesh(root, highStepGeometry, ivory, [sideSign * 3.15, 0.45, 0.08]);
    lowStep.name = `${sideName}-podium-stair-low`;
    middleStep.name = `${sideName}-podium-stair-middle`;
    highStep.name = `${sideName}-podium-stair-high`;
  }
  const captainDrum = addMesh(
    root,
    captainDrumGeometry,
    ivory,
    [0, STAGE_HEIGHTS.captainPodiumTop / 2, 1.05],
  );
  captainDrum.name = "captain-front-platform";
  addMesh(root, insetGeometry, trim, [0, 0.3, 1.58]);
  addMesh(root, sideInsetGeometry, trim, [-2.45, 0.34, 1.29]);
  addMesh(root, sideInsetGeometry, trim, [2.45, 0.34, 1.29]);

  const teamTop = new THREE.Object3D();
  teamTop.name = "teamTop";
  teamTop.position.set(0, STAGE_HEIGHTS.teammatePodiumTop, -0.28);
  const captainTop = new THREE.Object3D();
  captainTop.name = "captainTop";
  captainTop.position.set(0, STAGE_HEIGHTS.captainPodiumTop, 1.05);
  root.add(teamTop, captainTop);

  return {
    root,
    anchors: { teamTop, captainTop },
    dispose: owner.dispose,
  };
}

export function createStadium({
  palette,
  seed,
  team,
  profile = "desktop",
}) {
  const root = new THREE.Group();
  root.name = "full-scale-clay-stadium";
  const owner = createOwner(root);
  const random = seededUnit(seed);

  const fieldMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: createPitchTexture(owner),
    roughness: 0.98,
    metalness: 0,
  }));
  const standMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#6b4d42",
    roughness: 0.93,
    metalness: 0,
    flatShading: false,
  }));
  const seatMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#8a624f",
    roughness: 0.91,
    metalness: 0,
    flatShading: false,
  }));
  const structureMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#c1a17f",
    roughness: 0.84,
    metalness: 0.02,
    flatShading: false,
  }));
  const upperStructureMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#a98268",
    roughness: 0.9,
    metalness: 0.01,
    flatShading: false,
  }));
  const aisleMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#d2b99a",
    roughness: 0.92,
    metalness: 0,
    flatShading: false,
  }));
  const crowdMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#ffffff",
    flatShading: false,
    roughness: 0.96,
  }));
  const headMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#ffffff",
    flatShading: false,
    roughness: 0.97,
  }));
  const ribbonMaterials = [
    owner.material(new THREE.MeshStandardMaterial({ color: palette.primary, roughness: 0.84 })),
    owner.material(new THREE.MeshStandardMaterial({ color: palette.secondary, roughness: 0.86 })),
    owner.material(new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.84 })),
  ];
  const lampMaterial = owner.material(new THREE.MeshBasicMaterial({ color: "#ffd89a" }));
  const tunnelMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#2d211c",
    roughness: 0.98,
  }));
  const roofUndersideMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#49342d",
    roughness: 0.94,
    metalness: 0.01,
  }));
  const bannerTexture = createChampionBannerTexture(owner, { palette, team });
  const bannerMaterial = owner.material(new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: bannerTexture,
    emissive: "#ffffff",
    emissiveMap: bannerTexture,
    emissiveIntensity: 0.1,
    roughness: 0.82,
    metalness: 0.01,
    side: THREE.DoubleSide,
  }));

  const fieldGeometry = owner.geometry(new THREE.PlaneGeometry(24, 15));
  const field = addMesh(root, fieldGeometry, fieldMaterial, [0, STAGE_HEIGHTS.ground, 0]);
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;

  const tierGeometry = owner.geometry(createRoundedClayGeometry({
    width: 19,
    height: 0.88,
    depth: 1.7,
    radius: 0.16,
  }));
  const seatDeckGeometry = owner.geometry(createRoundedClayGeometry({
    width: 18.8,
    height: 0.14,
    depth: 1.45,
    radius: 0.055,
  }));
  const ribbonGeometry = owner.geometry(new THREE.BoxGeometry(18.6, 0.08, 0.08));
  const railGeometry = owner.geometry(new THREE.CylinderGeometry(0.025, 0.025, 18.4, 16));
  const concourseGeometry = owner.geometry(createRoundedClayGeometry({
    width: 17.7,
    height: 0.24,
    depth: 0.14,
    radius: 0.07,
  }));
  const tierFasciaGeometry = owner.geometry(createRoundedClayGeometry({
    width: 18.4,
    height: 0.18,
    depth: 0.18,
    radius: 0.055,
  }));
  const aisleGeometry = owner.geometry(createRoundedClayGeometry({
    width: 0.28,
    height: 0.07,
    depth: 1.3,
    radius: 0.025,
  }));
  const vomitoryGeometry = owner.geometry(createRoundedClayGeometry({
    width: 0.78,
    height: 0.42,
    depth: 0.16,
    radius: 0.12,
    topWidth: 0.68,
    bottomWidth: 0.78,
  }));
  for (let tier = 0; tier < 4; tier++) {
    const scale = 1 - tier * 0.045;
    const stand = addMesh(
      root,
      tierGeometry,
      standMaterial,
      [0, 0.44 + tier * 0.96, -4.8 - tier * 0.62],
    );
    stand.scale.set(scale, 1, 1);
    const seatDeck = addMesh(
      root,
      seatDeckGeometry,
      seatMaterial,
      [0, 0.93 + tier * 0.96, -3.98 - tier * 0.62],
    );
    seatDeck.scale.x = scale;
    addMesh(
      root,
      ribbonGeometry,
      ribbonMaterials[tier % ribbonMaterials.length],
      [0, 1.04 + tier * 0.96, -3.91 - tier * 0.62],
      [scale, 1, 1],
    );
    const rail = addMesh(
      root,
      railGeometry,
      structureMaterial,
      [0, 1.14 + tier * 0.96, -3.84 - tier * 0.62],
    );
    rail.rotation.z = Math.PI / 2;
    rail.scale.y = scale;
    addMesh(
      root,
      concourseGeometry,
      tunnelMaterial,
      [0, 0.69 + tier * 0.96, -3.82 - tier * 0.62],
      [scale, 1, 1],
    );
    const fascia = addMesh(
      root,
      tierFasciaGeometry,
      upperStructureMaterial,
      [0, 0.81 + tier * 0.96, -3.72 - tier * 0.62],
      [scale, 1, 1],
    );
    fascia.name = `stadium-tier-fascia-${tier + 1}`;
    for (const x of [-6.2, -2.1, 2.1, 6.2]) {
      const aisle = addMesh(
        root,
        aisleGeometry,
        aisleMaterial,
        [x * scale, 1.02 + tier * 0.96, -4.06 - tier * 0.62],
      );
      aisle.rotation.x = -0.08;
      aisle.name = `stadium-aisle-${tier + 1}`;
      if (tier < 3) {
        const opening = addMesh(
          root,
          vomitoryGeometry,
          tunnelMaterial,
          [x * scale, 0.72 + tier * 0.96, -3.61 - tier * 0.62],
          [scale, 1, 1],
        );
        opening.name = `stadium-vomitory-${tier + 1}`;
      }
    }
  }

  const wingGeometry = owner.geometry(createRoundedClayGeometry({
    width: 5.6,
    height: 1.15,
    depth: 1.6,
    radius: 0.16,
  }));
  const cornerGeometry = owner.geometry(createRoundedClayGeometry({
    width: 3.4,
    height: 0.96,
    depth: 1.72,
    radius: 0.18,
  }));
  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 4; tier++) {
      const corner = addMesh(
        root,
        cornerGeometry,
        standMaterial,
        [side * (8.15 - tier * 0.12), 0.48 + tier * 0.98, -4.38 - tier * 0.62],
        [1 - tier * 0.055, 0.94, 1],
      );
      corner.rotation.y = -side * 0.17;
      corner.name = `stadium-corner-tier-${side < 0 ? "left" : "right"}-${tier + 1}`;
    }
  }
  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 3; tier++) {
      const wing = addMesh(
        root,
        wingGeometry,
        standMaterial,
        [side * (9.15 - tier * 0.24), 0.48 + tier * 1.02, -3.7 - tier * 0.62],
      );
      wing.rotation.y = -side * 0.28;
      wing.scale.y = 0.82;
    }
  }

  const beamGeometry = owner.geometry(
    new THREE.CylinderGeometry(0.09, 0.12, 6, 16),
  );
  for (const x of [-8.5, -5.5, 5.5, 8.5]) {
    const beam = addMesh(root, beamGeometry, structureMaterial, [x, 3.7, -6.4]);
    beam.rotation.z = x < 0 ? -0.14 : 0.14;
  }
  const roofGeometry = owner.geometry(new THREE.BoxGeometry(18.5, 0.28, 1.1));
  const roof = addMesh(root, roofGeometry, structureMaterial, [0, 6.72, -6.15]);
  roof.name = "stadium-roof-crown";
  const roofUnderside = addMesh(
    root,
    owner.geometry(createRoundedClayGeometry({
      width: 18.15,
      height: 0.16,
      depth: 1.34,
      radius: 0.06,
    })),
    roofUndersideMaterial,
    [0, 6.53, -6.02],
  );
  roofUnderside.name = "stadium-roof-underside";
  const roofFascia = addMesh(
    root,
    owner.geometry(createRoundedClayGeometry({
      width: 18.3,
      height: 0.34,
      depth: 0.18,
      radius: 0.055,
    })),
    upperStructureMaterial,
    [0, 6.64, -5.48],
  );
  roofFascia.name = "stadium-roof-fascia";
  const trussGeometry = owner.geometry(new THREE.CylinderGeometry(0.06, 0.06, 5.2, 12));
  for (const x of [-5.8, 0, 5.8]) {
    const truss = addMesh(root, trussGeometry, structureMaterial, [x, 6.18, -5.82]);
    truss.rotation.z = Math.PI / 2 + (x === 0 ? 0 : x < 0 ? 0.18 : -0.18);
  }
  const catwalkGeometry = owner.geometry(new THREE.BoxGeometry(16.8, 0.08, 0.38));
  const catwalk = addMesh(root, catwalkGeometry, structureMaterial, [0, 6.08, -5.56]);
  catwalk.name = "stadium-roof-catwalk";
  const catwalkRailGeometry = owner.geometry(new THREE.CylinderGeometry(0.025, 0.025, 16.7, 12));
  const catwalkRail = addMesh(root, catwalkRailGeometry, structureMaterial, [0, 6.28, -5.38]);
  catwalkRail.rotation.z = Math.PI / 2;
  const floodBankGeometry = owner.geometry(createRoundedClayGeometry({
    width: 2.5,
    height: 0.32,
    depth: 0.12,
    radius: 0.04,
  }));
  for (const x of [-6.2, -2.05, 2.05, 6.2]) {
    const bank = addMesh(root, floodBankGeometry, roofUndersideMaterial, [x, 6.36, -5.42]);
    bank.name = "stadium-floodlight-bank";
  }
  const lampGeometry = owner.geometry(new THREE.CapsuleGeometry(0.06, 0.5, 4, 12));
  for (const x of [-7.4, -5.5, -3.6, -1.7, 1.7, 3.6, 5.5, 7.4]) {
    const lamp = addMesh(root, lampGeometry, lampMaterial, [x, 6.48, -5.52]);
    lamp.rotation.z = Math.PI / 2;
  }

  const tunnel = addMesh(
    root,
    owner.geometry(new THREE.BoxGeometry(1.6, 1.18, 0.12)),
    tunnelMaterial,
    [STAGE_LAYOUT.bannerX, 0.59, -4.05],
  );
  tunnel.name = "stadium-tunnel";
  const tunnelTopGeometry = owner.geometry(new THREE.BoxGeometry(1.9, 0.12, 0.16));
  const tunnelSideGeometry = owner.geometry(new THREE.BoxGeometry(0.12, 1.3, 0.16));
  addMesh(root, tunnelTopGeometry, structureMaterial, [STAGE_LAYOUT.bannerX, 1.24, -3.96]);
  addMesh(
    root,
    tunnelSideGeometry,
    structureMaterial,
    [STAGE_LAYOUT.bannerX - 0.85, 0.62, -3.96],
  );
  addMesh(
    root,
    tunnelSideGeometry,
    structureMaterial,
    [STAGE_LAYOUT.bannerX + 0.85, 0.62, -3.96],
  );
  const bannerFrameGeometry = owner.geometry(new THREE.BoxGeometry(7.3, 1.22, 0.16));
  addMesh(
    root,
    bannerFrameGeometry,
    structureMaterial,
    [STAGE_LAYOUT.bannerX, 5.15, -3.88],
  );
  const banner = addMesh(
    root,
    owner.geometry(new THREE.PlaneGeometry(6.95, 0.94)),
    bannerMaterial,
    [STAGE_LAYOUT.bannerX, 5.15, -3.78],
  );
  banner.name = "champions-banner";

  const bodyGeometry = owner.geometry(new THREE.CapsuleGeometry(0.065, 0.2, 6, 14));
  const headGeometry = owner.geometry(new THREE.SphereGeometry(0.075, 16, 12));
  const armGeometry = owner.geometry(new THREE.CapsuleGeometry(0.022, 0.15, 5, 10));
  const crowdBodies = new THREE.InstancedMesh(bodyGeometry, crowdMaterial, MAX_CROWD_INSTANCES);
  const crowdHeads = new THREE.InstancedMesh(headGeometry, headMaterial, MAX_CROWD_INSTANCES);
  const crowdArms = new THREE.InstancedMesh(
    armGeometry,
    crowdMaterial,
    MAX_CROWD_INSTANCES * 2,
  );
  crowdBodies.name = "crowd-bodies";
  crowdHeads.name = "crowd-heads";
  crowdArms.name = "crowd-arms";
  crowdBodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crowdHeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crowdArms.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crowdBodies.frustumCulled = false;
  crowdHeads.frustumCulled = false;
  crowdArms.frustumCulled = false;
  root.add(crowdBodies, crowdHeads, crowdArms);

  const basePositions = new Float32Array(MAX_CROWD_INSTANCES * 3);
  const phases = new Float32Array(MAX_CROWD_INSTANCES);
  const scales = new Float32Array(MAX_CROWD_INSTANCES);
  const dummy = new THREE.Object3D();
  const crowdColor = new THREE.Color();
  const crowdColors = [
    palette.primary,
    palette.secondary,
    palette.accent,
    "#4b5568",
    "#d5a947",
  ];
  for (let index = 0; index < MAX_CROWD_INSTANCES; index++) {
    const tier = index % 4;
    const column = Math.floor(index / 4);
    const tierColumn = column % 80;
    const aisleGap = [11, 30, 49, 69].some(aisle => Math.abs(tierColumn - aisle) <= 1);
    const scale = aisleGap ? 0 : 0.82 + random() * 0.3;
    const x = -8.45 + tierColumn * 0.214 + (random() - 0.5) * 0.07;
    const y = 0.98 + tier * 0.96 + random() * 0.14;
    const z = -4.02 - tier * 0.62 + (random() - 0.5) * 0.15;
    const offset = index * 3;
    basePositions[offset] = x;
    basePositions[offset + 1] = y;
    basePositions[offset + 2] = z;
    phases[index] = random() * Math.PI * 2;
    scales[index] = scale;
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(scale * 0.88, scale, scale * 0.88);
    dummy.updateMatrix();
    crowdBodies.setMatrixAt(index, dummy.matrix);
    crowdBodies.setColorAt(index, crowdColor.set(crowdColors[index % crowdColors.length]));
    dummy.position.y = y + 0.22 * scale;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    crowdHeads.setMatrixAt(index, dummy.matrix);
    crowdHeads.setColorAt(
      index,
      crowdColor.set(PLAYER_SKIN_TONES[index % PLAYER_SKIN_TONES.length]),
    );
    for (const side of [-1, 1]) {
      const armIndex = index * 2 + (side > 0 ? 1 : 0);
      dummy.position.set(x + side * 0.06 * scale, y + 0.12 * scale, z);
      dummy.rotation.z = -side * 0.34;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      crowdArms.setMatrixAt(armIndex, dummy.matrix);
      crowdArms.setColorAt(
        armIndex,
        crowdColor.set(crowdColors[(index + (side > 0 ? 1 : 0)) % crowdColors.length]),
      );
    }
  }
  crowdBodies.instanceMatrix.needsUpdate = true;
  crowdHeads.instanceMatrix.needsUpdate = true;
  crowdArms.instanceMatrix.needsUpdate = true;
  if (crowdBodies.instanceColor) crowdBodies.instanceColor.needsUpdate = true;
  if (crowdHeads.instanceColor) crowdHeads.instanceColor.needsUpdate = true;
  if (crowdArms.instanceColor) crowdArms.instanceColor.needsUpdate = true;

  function setProfile(nextProfile) {
    const count = nextProfile === "phone" ? PHONE_CROWD_INSTANCES : MAX_CROWD_INSTANCES;
    crowdBodies.count = count;
    crowdHeads.count = count;
    crowdArms.count = count * 2;
  }
  setProfile(profile);
  setProfile(profile);
  return {
    root,
    crowd: {
      bodies: crowdBodies,
      heads: crowdHeads,
      arms: crowdArms,
      basePositions,
      phases,
      scales,
      dummy,
      setProfile,
    },
    banner: {
      mesh: banner,
      material: bannerMaterial,
    },
    setProfile,
    dispose: owner.dispose,
  };
}
