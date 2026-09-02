import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const studios = new WeakMap();
const loader = new THREE.TextureLoader();

const finishColors = {
  Gold: { color: "#d8a441", highlight: "#ffe7a0", shadow: "#8e6925", roughness: 0.2 },
  Silver: { color: "#d9dde0", highlight: "#ffffff", shadow: "#7d8588", roughness: 0.16 },
  "Rose Gold": { color: "#d8a28e", highlight: "#ffd8cb", shadow: "#8e5f52", roughness: 0.22 },
  Black: { color: "#171717", highlight: "#5a5a5a", shadow: "#050505", roughness: 0.3 },
  "Two Tone": { color: "#d8a441", highlight: "#ffe7a0", shadow: "#8e6925", roughness: 0.2, accent: "#d9dde0" },
};

const fontStacks = {
  serif: "Georgia, serif",
  "great-vibes": "Great Vibes, Georgia, serif",
  allura: "Allura, Georgia, serif",
  dancing: "Dancing Script, Georgia, serif",
  parisienne: "Parisienne, Georgia, serif",
  imperial: "Imperial Script, Georgia, serif",
  alex: "Alex Brush, Georgia, serif",
  tangerine: "Tangerine, Georgia, serif",
  script: "Georgia, serif",
  playfair: "Playfair Display, Georgia, serif",
  gothic: "UnifrakturMaguntia, Georgia, serif",
  cinzel: "Cinzel, Georgia, serif",
  sans: "Inter, Arial, sans-serif",
  caps: "Montserrat, Arial, sans-serif",
};

function selectedValue(form, name, fallback = "") {
  return form?.querySelector(`[name="${name}"]:checked`)?.value || form?.elements?.[name]?.value || fallback;
}

function payloadFromForm(form) {
  const stage = form?.closest(".customizer-studio")?.querySelector("[data-custom-preview]");
  return {
    pieceId: form?.designPiece?.value || stage?.dataset.piece || "bar-necklace",
    variantId: form?.designVariant?.value || stage?.dataset.variant || "clean-bar",
    surface: stage?.dataset.surface || "bar",
    finish: selectedValue(form, "finish", "Gold"),
    choice: selectedValue(form, "choice", "Customize"),
    side: selectedValue(form, "side", "Front"),
    font: form?.designFont?.value || "serif",
    chainStyle: form?.chainStyle?.value || "Fine Chain",
    text: form?.engraving?.value?.trim() || "Amina",
    textSize: Number(form?.textSize?.value || 34),
    rotateY: Number(form?.rotateY?.value || 0),
    uploadedPhoto: stage?.uploadedPhotoSrc || "",
  };
}

function metalMaterial(finish = "Gold", accent = false) {
  const spec = finishColors[finish] || finishColors.Gold;
  return new THREE.MeshPhysicalMaterial({
    color: accent ? spec.accent || spec.highlight || "#d9dde0" : spec.color,
    metalness: finish === "Black" ? 0.82 : 0.96,
    roughness: spec.roughness,
    envMapIntensity: finish === "Black" ? 1.9 : 1.65,
    clearcoat: 0.34,
    clearcoatRoughness: 0.18,
    reflectivity: 0.86,
    specularIntensity: finish === "Black" ? 0.62 : 1,
    specularColor: spec.highlight || "#ffffff",
  });
}

function darkMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#202020",
    metalness: 0.86,
    roughness: 0.28,
    envMapIntensity: 2.15,
    clearcoat: 0.42,
    clearcoatRoughness: 0.18,
    reflectivity: 0.72,
    specularIntensity: 0.76,
    specularColor: "#f4dfad",
  });
}

function highlightMaterial(finish = "Gold") {
  const spec = finishColors[finish] || finishColors.Gold;
  return new THREE.MeshBasicMaterial({
    color: finish === "Black" ? spec.highlight : spec.highlight || spec.color,
    transparent: true,
    opacity: finish === "Black" ? 0.55 : 0.38,
  });
}

function setOpacity(group, opacity) {
  group.traverse((node) => {
    if (!node.material) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => {
      material.transparent = material.userData.keepTransparent || opacity < 1;
      material.opacity = opacity;
    });
  });
}

function disposeObject(object) {
  object.traverse((node) => {
    if (node.geometry) node.geometry.dispose();
    if (!node.material) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => {
      if (material.map) material.map.dispose();
      if (material.alphaMap) material.alphaMap.dispose();
      material.dispose();
    });
  });
}

function textColorFor(finish) {
  return finish === "Black" ? "#f8e7b1" : "#101010";
}

function makeTextTexture(payload, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = options.width || 768;
  canvas.height = options.height || 1024;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const color = options.color || textColorFor(payload.finish);
  const fontFamily = fontStacks[payload.font] || fontStacks.serif;
  const isVertical = options.vertical;
  const text = payload.choice === "Keep Plain" ? "" : payload.text || "Amina";
  const maxFontSize = options.maxFontSize || 132;
  const fontSize = Math.max(28, Math.min(options.fontSize || payload.textSize * 1.55, maxFontSize));

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${options.weight || 800} ${fontSize}px ${fontFamily}`;
  ctx.shadowColor = payload.finish === "Black" ? "rgba(0,0,0,.8)" : "rgba(255,255,255,.45)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.lineJoin = "round";
  ctx.lineWidth = options.strokeWidth || Math.max(2, fontSize * 0.035);
  ctx.strokeStyle = payload.finish === "Black" ? "rgba(0,0,0,.42)" : "rgba(255,255,255,.34)";

  const drawEngraving = (label, x, y, maxWidth) => {
    if (!label) return;
    ctx.strokeText(label, x, y, maxWidth);
    ctx.fillText(label, x, y, maxWidth);
  };

  if (isVertical) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    drawEngraving(text, 0, 0, canvas.height * 0.82);
    ctx.restore();
  } else {
    const lines = wrapText(ctx, text, canvas.width * 0.8);
    const lineHeight = fontSize * 1.12;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => drawEngraving(line, canvas.width / 2, startY + index * lineHeight));
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let line = words.shift();
  words.forEach((word) => {
    const next = `${line} ${word}`;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  lines.push(line);
  return lines.slice(0, 4);
}

function makePhotoTexture(src) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d");
  drawDogTagMask(ctx, canvas.width, canvas.height, "#202827");
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8e7b1";
  ctx.font = "900 90px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Upload", canvas.width / 2, canvas.height / 2 - 34);
  ctx.fillText("Photo", canvas.width / 2, canvas.height / 2 + 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  if (src) {
    const image = new Image();
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      drawDogTagMask(ctx, canvas.width, canvas.height);
      ctx.clip();
      coverImage(ctx, image, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      texture.needsUpdate = true;
    };
    image.src = src;
  }

  return texture;
}

function drawDogTagMask(ctx, width, height, fillStyle) {
  const cut = width * 0.18;
  ctx.beginPath();
  ctx.moveTo(cut, 0);
  ctx.lineTo(width - cut, 0);
  ctx.lineTo(width, cut);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.lineTo(0, cut);
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
}

function coverImage(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function texturePlane(texture, width, height, z = 0.08) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.02,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  material.userData.keepTransparent = true;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    material,
  );
  mesh.position.z = z;
  mesh.renderOrder = 20;
  return mesh;
}

function addRoundedFrame(group, width, height, thickness, depth, finish, z = 0.09) {
  const material = metalMaterial(finish, true);
  const top = new THREE.Mesh(new RoundedBoxGeometry(width, thickness, depth, 2, thickness / 2), material);
  const bottom = top.clone();
  const left = new THREE.Mesh(new RoundedBoxGeometry(thickness, height, depth, 2, thickness / 2), material);
  const right = left.clone();
  top.position.set(0, height / 2, z);
  bottom.position.set(0, -height / 2, z);
  left.position.set(-width / 2, 0, z);
  right.position.set(width / 2, 0, z);
  [top, bottom, left, right].forEach((part) => {
    part.castShadow = true;
    group.add(part);
  });
}

function addSpecularStripe(group, width, height, finish, z = 0.1) {
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(width, height), highlightMaterial(finish));
  stripe.position.set(-width * 0.28, height * 0.04, z);
  stripe.rotation.z = -0.16;
  stripe.renderOrder = 12;
  group.add(stripe);
}

function addSoftReflection(group, width, height, finish, z = 0.1, x = 0.18, opacity = 0.22) {
  const material = highlightMaterial(finish);
  material.opacity = opacity;
  const shine = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  shine.position.set(x, 0, z);
  shine.rotation.z = 0.2;
  shine.renderOrder = 11;
  group.add(shine);
}

function addRaisedLine(group, x1, y1, x2, y2, finish, z = 0.14, width = 0.018) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const line = new THREE.Mesh(new RoundedBoxGeometry(length, width, 0.026, 2, width / 2), metalMaterial(finish, true));
  line.position.set((x1 + x2) / 2, (y1 + y2) / 2, z);
  line.rotation.z = Math.atan2(y2 - y1, x2 - x1);
  line.castShadow = true;
  group.add(line);
}

function addStud(group, x, y, finish, scale = 1, z = 0.14) {
  const stud = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scale, 20, 12), metalMaterial(finish, true));
  stud.scale.z = 0.22;
  stud.position.set(x, y, z);
  stud.castShadow = true;
  group.add(stud);
}

function addSideRidges(group, finish, x, yPositions, z = 0.16) {
  yPositions.forEach((y) => {
    const ridge = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.018, 0.028, 2, 0.009), metalMaterial(finish, true));
    ridge.position.set(x, y, z);
    ridge.rotation.z = x > 0 ? 0.12 : -0.12;
    ridge.castShadow = true;
    group.add(ridge);
  });
}

function addPendantLink(group, finish, x, y, scale = 1) {
  const link = new THREE.Mesh(new THREE.TorusGeometry(0.105 * scale, 0.024 * scale, 12, 36), metalMaterial(finish));
  link.position.set(x, y, 0.12);
  link.rotation.x = Math.PI / 2;
  link.castShadow = true;
  group.add(link);
}

function addEdgeOutline(group, geometryFactory, finish, scale = 1.02) {
  const geometry = geometryFactory(0.025);
  geometry.center();
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 20),
    new THREE.LineBasicMaterial({
      color: finish === "Black" ? "#777777" : finishColors[finish]?.highlight || "#ffe7a0",
      transparent: true,
      opacity: finish === "Black" ? 0.62 : 0.48,
    }),
  );
  edges.scale.set(scale, scale, scale);
  edges.renderOrder = 18;
  group.add(edges);
}

function addBail(group, finish, y = 0.95, z = 0.08) {
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 14, 42), metalMaterial(finish));
  bail.position.set(0, y, z);
  bail.rotation.x = Math.PI / 2;
  bail.castShadow = true;
  group.add(bail);
  return bail;
}

function addStone(group, x, y, color = "#ffffff", scale = 1) {
  const stone = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.075 * scale, 0),
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.04,
      metalness: 0,
      transmission: 0.25,
      thickness: 0.2,
      envMapIntensity: 2,
      clearcoat: 1,
    }),
  );
  stone.position.set(x, y, 0.14);
  stone.scale.z = 0.34;
  group.add(stone);
}

function chainArc(width = 2.1, height = 1.4, finish = "Gold", style = "Fine Chain") {
  const group = new THREE.Group();
  const material = metalMaterial(finish);
  const tubeRadius = style === "Rope Chain" ? 0.028 : style === "Curb Chain" ? 0.024 : 0.018;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-width / 2, 0.2, 0),
    new THREE.Vector3(-width / 3, height, 0),
    new THREE.Vector3(width / 3, height, 0),
    new THREE.Vector3(width / 2, 0.2, 0),
  ]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, tubeRadius, 8, false), material);
  tube.position.y = 0.45;
  tube.castShadow = true;
  group.add(tube);
  {
    const beadCount = style === "Fine Chain" ? 22 : style === "Rope Chain" ? 30 : 20;
    for (let index = 0; index < beadCount; index += 1) {
      const point = curve.getPoint(index / Math.max(1, beadCount - 1));
      const bead = new THREE.Mesh(
        new THREE.TorusGeometry(tubeRadius * (style === "Fine Chain" ? 1.55 : 1.9), tubeRadius * 0.38, 6, 14),
        material,
      );
      bead.position.copy(point).add(new THREE.Vector3(0, 0.45, 0));
      bead.rotation.set(Math.PI / 2, 0.18 * Math.sin(index), index * (style === "Rope Chain" ? 0.75 : 0.45));
      bead.castShadow = true;
      group.add(bead);
    }
  }
  return group;
}

function createBar(payload) {
  const group = new THREE.Group();
  group.add(chainArc(1.8, 1.35, payload.finish, payload.chainStyle));
  const bar = new THREE.Mesh(new RoundedBoxGeometry(0.54, 2.42, 0.22, 9, 0.18), metalMaterial(payload.finish));
  bar.castShadow = true;
  bar.receiveShadow = true;
  group.add(bar);
  const inset = new THREE.Mesh(new RoundedBoxGeometry(0.43, 2.05, 0.025, 5, 0.12), metalMaterial(payload.finish, payload.finish === "Two Tone"));
  inset.position.z = 0.12;
  inset.castShadow = true;
  group.add(inset);
  addRaisedLine(group, -0.18, 1, -0.18, -1, payload.finish, 0.16, 0.018);
  addRaisedLine(group, 0.18, 1, 0.18, -1, payload.finish, 0.16, 0.018);
  addSpecularStripe(group, 0.11, 1.82, payload.finish, 0.145);
  addSoftReflection(group, 0.08, 1.65, payload.finish, 0.15, 0.15, payload.finish === "Black" ? 0.34 : 0.18);
  addBail(group, payload.finish, 1.32, 0.04);
  addPendantLink(group, payload.finish, 0, 1.16, 0.78);
  const text = texturePlane(makeTextTexture(payload, { vertical: true, width: 512, height: 1024, fontSize: 128 }), 0.37, 1.92, 0.155);
  group.add(text);
  group.rotation.x = -0.12;
  return group;
}

function createDogTagShapeGeometry(depth = 0.14) {
  const width = 1.18;
  const height = 1.72;
  const cut = 0.22;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 + cut, height / 2);
  shape.lineTo(width / 2 - cut, height / 2);
  shape.lineTo(width / 2, height / 2 - cut);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(-width / 2, -height / 2);
  shape.lineTo(-width / 2, height / 2 - cut);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.03, bevelSegments: 3 });
}

function createDogTag(payload, withPhoto = false) {
  const group = new THREE.Group();
  group.add(chainArc(1.55, 1.18, payload.finish, payload.chainStyle));
  const tag = new THREE.Mesh(createDogTagShapeGeometry(), payload.finish === "Black" ? darkMaterial() : metalMaterial(payload.finish));
  tag.geometry.center();
  tag.castShadow = true;
  tag.receiveShadow = true;
  group.add(tag);
  addEdgeOutline(group, createDogTagShapeGeometry, payload.finish, 1.015);

  const faceTexture = withPhoto && payload.side !== "Back" ? makePhotoTexture(payload.uploadedPhoto) : makeTextTexture(payload, { width: 860, height: 1080, fontSize: 92, maxFontSize: 108 });
  const face = texturePlane(faceTexture, 0.9, 1.22, 0.13);
  face.position.y = -0.08;
  group.add(face);

  addStud(group, -0.42, -0.63, payload.finish, 0.9, 0.13);
  addStud(group, 0.42, -0.63, payload.finish, 0.9, 0.13);
  addRaisedLine(group, -0.45, 0.44, -0.36, 0.54, payload.finish, 0.14, 0.018);
  addRaisedLine(group, 0.45, 0.44, 0.36, 0.54, payload.finish, 0.14, 0.018);
  addSoftReflection(group, 0.06, 0.92, payload.finish, 0.145, -0.49, payload.finish === "Black" ? 0.12 : 0.1);
  const hole = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.026, 14, 42), payload.finish === "Black" ? metalMaterial("Silver") : darkMaterial());
  hole.position.set(0, 0.61, 0.155);
  group.add(hole);
  addBail(group, payload.finish, 0.98, 0.04);
  group.rotation.x = -0.13;
  return group;
}

function createNameNecklace(payload) {
  const group = new THREE.Group();
  group.add(chainArc(2.4, 1.2, payload.finish, payload.chainStyle));
  const nameColor = payload.finish === "Black" ? "#f8e7b1" : finishColors[payload.finish]?.color || "#d8a441";
  const texture = makeTextTexture(payload, { width: 1400, height: 440, fontSize: 112, weight: 500, color: nameColor });
  const shadow = texturePlane(makeTextTexture(payload, { width: 1400, height: 440, fontSize: 112, weight: 500, color: "#080808" }), 2.15, 0.68, 0.025);
  shadow.position.set(0.04, -0.2, 0.02);
  shadow.material.opacity = 0.32;
  group.add(shadow);
  const name = texturePlane(texture, 2.15, 0.68, 0.04);
  name.position.y = -0.16;
  group.add(name);
  addRaisedLine(group, -1.14, 0.58, -1.02, 0.1, payload.finish, 0.06, 0.024);
  addRaisedLine(group, 1.14, 0.58, 1.02, 0.1, payload.finish, 0.06, 0.024);
  addPendantLink(group, payload.finish, -1.02, 0.08, 0.64);
  addPendantLink(group, payload.finish, 1.02, 0.08, 0.64);
  [-0.72, -0.36, 0, 0.36, 0.72].forEach((x, index) => {
    if (index % 2 === 0) addStone(group, x, -0.45, payload.finish === "Black" ? "#f4dfad" : "#ffffff", 0.46);
  });
  if (payload.variantId.includes("heart")) addCharm(group, "heart", payload.finish);
  if (payload.variantId.includes("butterfly")) addCharm(group, "butterfly", payload.finish);
  if (payload.variantId.includes("wings")) addWings(group, payload.finish);
  group.rotation.x = -0.08;
  return group;
}

function addCharm(group, type, finish) {
  const material = metalMaterial(finish);
  const charm = new THREE.Mesh(type === "heart" ? new THREE.SphereGeometry(0.15, 24, 14) : new THREE.OctahedronGeometry(0.17), material);
  charm.scale.set(type === "heart" ? 1.08 : 1.22, 0.72, 0.22);
  charm.position.set(0.98, -0.08, 0.05);
  charm.castShadow = true;
  group.add(charm);
  addStone(group, 1.08, 0.03, "#fff6d0", 0.65);
}

function addWings(group, finish) {
  const material = metalMaterial(finish);
  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.48, 4, 12), material);
    wing.scale.set(1.8, 0.55, 0.08);
    wing.rotation.z = side * 0.92;
    wing.position.set(side * 0.82, -0.08, 0.04);
    group.add(wing);
  });
}

function createBracelet(payload) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.105, 16, 100), metalMaterial(payload.finish));
  ring.scale.y = 0.58;
  ring.position.z = -0.08;
  group.add(ring);
  for (let index = 0; index < 22; index += 1) {
    const angle = (index / 22) * Math.PI * 2;
    if (Math.abs(Math.sin(angle)) < 0.38 && Math.cos(angle) < 0) continue;
    const link = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.28, 0.12, 3, 0.04), metalMaterial(payload.finish, index % 2 === 0 && payload.finish === "Two Tone"));
    link.position.set(Math.cos(angle) * 1.18, Math.sin(angle) * 0.68 - 0.02, -0.05 + Math.sin(angle) * 0.04);
    link.rotation.z = angle;
    link.castShadow = true;
    group.add(link);
  }
  const plate = new THREE.Mesh(new RoundedBoxGeometry(1.65, 0.36, 0.14, 6, 0.12), metalMaterial(payload.finish, payload.finish === "Two Tone"));
  plate.position.y = -0.1;
  plate.castShadow = true;
  group.add(plate);
  addSoftReflection(group, 0.36, 0.1, payload.finish, 0.105, -0.5, payload.finish === "Black" ? 0.18 : 0.12);
  addRaisedLine(group, -0.63, 0.08, 0.63, 0.08, payload.finish, 0.105, 0.014);
  addRaisedLine(group, -0.63, -0.28, 0.63, -0.28, payload.finish, 0.105, 0.014);
  addRoundedFrame(group, 1.5, 0.26, 0.035, 0.035, payload.finish, 0.09);
  addStone(group, -0.74, -0.1, "#f9fbff", 0.72);
  addStone(group, 0.74, -0.1, "#f9fbff", 0.72);
  addStud(group, -0.92, -0.1, payload.finish, 0.9, 0.12);
  addStud(group, 0.92, -0.1, payload.finish, 0.9, 0.12);
  const text = texturePlane(makeTextTexture(payload, { width: 1024, height: 260, fontSize: 84, maxFontSize: 92 }), 1.34, 0.22, 0.12);
  text.position.y = -0.1;
  group.add(text);
  group.rotation.x = -0.04;
  return group;
}

function createEnvelope(payload) {
  const group = new THREE.Group();
  group.add(chainArc(1.6, 1.05, payload.finish, payload.chainStyle));
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.36, 0.92, 0.12, 4, 0.04), metalMaterial(payload.finish));
  base.castShadow = true;
  group.add(base);
  const flap = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.68, 3), metalMaterial(payload.finish, true));
  flap.rotation.z = Math.PI;
  flap.position.set(0, 0.1, 0.105);
  flap.castShadow = true;
  group.add(flap);
  addRaisedLine(group, -0.57, 0.31, 0, -0.02, payload.finish, 0.145, 0.018);
  addRaisedLine(group, 0.57, 0.31, 0, -0.02, payload.finish, 0.145, 0.018);
  addRaisedLine(group, -0.56, -0.36, 0, -0.02, payload.finish, 0.145, 0.018);
  addRaisedLine(group, 0.56, -0.36, 0, -0.02, payload.finish, 0.145, 0.018);
  addStud(group, 0, -0.02, payload.finish, 0.8, 0.16);
  addSoftReflection(group, 0.42, 0.72, payload.finish, 0.15, -0.36, payload.finish === "Black" ? 0.26 : 0.16);
  addRoundedFrame(group, 1.18, 0.74, 0.035, 0.035, payload.finish, 0.13);
  addBail(group, payload.finish, 0.64, 0.03);
  const text = texturePlane(makeTextTexture(payload, { width: 900, height: 360, fontSize: 66, maxFontSize: 78 }), 0.92, 0.32, 0.145);
  text.position.y = -0.16;
  group.add(text);
  group.rotation.x = -0.1;
  return group;
}

function createBook(payload) {
  const group = new THREE.Group();
  group.add(chainArc(1.45, 1.0, payload.finish, payload.chainStyle));
  const left = new THREE.Mesh(new RoundedBoxGeometry(0.68, 1.08, 0.12, 4, 0.04), metalMaterial(payload.finish));
  const right = new THREE.Mesh(new RoundedBoxGeometry(0.68, 1.08, 0.12, 4, 0.04), metalMaterial(payload.finish, true));
  left.position.x = -0.34;
  right.position.x = 0.34;
  right.rotation.y = -0.28;
  group.add(left, right);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.16, 18), metalMaterial(payload.finish));
  hinge.position.set(0, 0, 0.08);
  hinge.rotation.z = 0;
  group.add(hinge);
  [-0.18, -0.06, 0.06, 0.18].forEach((y) => {
    addRaisedLine(group, 0.03, y, 0.62, y - 0.04, payload.finish, 0.16, 0.012);
  });
  [0.34, -0.34].forEach((x) => addStud(group, x, 0.46, payload.finish, 0.72, 0.14));
  addStone(group, 0.36, -0.28, "#fff6d0", 0.78);
  const text = texturePlane(makeTextTexture(payload, { width: 560, height: 760, fontSize: 62, maxFontSize: 76 }), 0.52, 0.74, 0.13);
  text.position.set(-0.34, -0.04, 0.12);
  group.add(text);
  addBail(group, payload.finish, 0.78, 0.03);
  addSoftReflection(group, 0.26, 0.86, payload.finish, 0.15, -0.48, payload.finish === "Black" ? 0.28 : 0.16);
  group.rotation.x = -0.1;
  return group;
}

function createCuff(payload) {
  const group = new THREE.Group();
  const cuff = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.09, 18, 128, Math.PI * 1.62), metalMaterial(payload.finish));
  cuff.rotation.set(0, 0, 0.74);
  cuff.scale.y = 0.52;
  cuff.position.z = -0.08;
  cuff.castShadow = true;
  group.add(cuff);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(1.65, 0.2, 0.09, 5, 0.08), metalMaterial(payload.finish, true));
  plate.position.y = -0.14;
  plate.castShadow = true;
  group.add(plate);
  addRaisedLine(group, -0.76, -0.04, 0.76, -0.04, payload.finish, 0.085, 0.012);
  addRaisedLine(group, -0.76, -0.24, 0.76, -0.24, payload.finish, 0.085, 0.012);
  [-0.58, -0.28, 0.28, 0.58].forEach((x) => addStud(group, x, 0.14, payload.finish, 0.58, 0.1));
  [-0.9, 0.9].forEach((x) => addStone(group, x, 0.05, "#fff6d0", 0.85));
  const text = texturePlane(makeTextTexture(payload, { width: 1200, height: 260, fontSize: 72, maxFontSize: 84 }), 1.38, 0.17, 0.095);
  text.position.y = -0.14;
  group.add(text);
  group.rotation.x = -0.08;
  return group;
}

function createKeyholder(payload) {
  const group = createDogTag(payload, true);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.052, 16, 64), metalMaterial(payload.finish));
  ring.position.y = 1.18;
  ring.castShadow = true;
  const connector = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.026, 12, 38), metalMaterial(payload.finish));
  connector.position.y = 0.87;
  const splitGap = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.028, 0.045, 2, 0.012), darkMaterial());
  splitGap.position.set(0.24, 1.36, 0.05);
  splitGap.rotation.z = 0.55;
  group.add(ring);
  group.add(connector);
  group.add(splitGap);
  return group;
}

function createModel(payload) {
  const group = new THREE.Group();
  let model;
  if (payload.pieceId === "bar-necklace") model = createBar(payload);
  else if (payload.pieceId === "photo-pendant") model = createDogTag(payload, true);
  else if (payload.pieceId === "dog-tag") model = createDogTag(payload, false);
  else if (payload.pieceId === "name-necklace") model = createNameNecklace(payload);
  else if (payload.pieceId === "name-bracelet") model = createBracelet(payload);
  else if (payload.pieceId === "envelope-necklace") model = createEnvelope(payload);
  else if (payload.pieceId === "book-pendant") model = createBook(payload);
  else if (payload.pieceId === "keyholder") model = createKeyholder(payload);
  else model = createCuff(payload);
  group.add(model);
  group.rotation.y = THREE.MathUtils.degToRad(payload.rotateY || 0);
  return group;
}

function createStudio(viewport) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  viewport.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#111716");
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.35, 4.8);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 2.7;
  controls.maxDistance = 7.5;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;

  let resumeTimer = 0;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    window.clearTimeout(resumeTimer);
  });
  controls.addEventListener("end", () => {
    resumeTimer = window.setTimeout(() => {
      if (isVisible) controls.autoRotate = true;
    }, 2600);
  });

  scene.add(new THREE.HemisphereLight("#fff4cf", "#07100e", 1.55));
  const key = new THREE.DirectionalLight("#ffe7a0", 2.6);
  key.position.set(3, 4, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  scene.add(key);
  const rim = new THREE.PointLight("#9fd5ff", 1.25, 8);
  rim.position.set(-2.8, 1.6, 2.5);
  scene.add(rim);
  const frontSoftbox = new THREE.RectAreaLight("#ffffff", 2.4, 3.4, 2.8);
  frontSoftbox.position.set(0, 1.25, 3.2);
  frontSoftbox.lookAt(0, 0, 0);
  scene.add(frontSoftbox);
  const goldKick = new THREE.PointLight("#ffd67a", 1.25, 5);
  goldKick.position.set(2.2, -0.6, 2.1);
  scene.add(goldKick);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(1.95, 96),
    new THREE.ShadowMaterial({ color: "#000000", opacity: 0.42 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.22;
  floor.receiveShadow = true;
  scene.add(floor);

  const studio = { viewport, renderer, scene, camera, controls, current: null, payloadKey: "", disposed: false };
  studios.set(viewport, studio);

  const resize = () => {
    const rect = viewport.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  studio.observer = observer;
  resize();

  let isVisible = true;
  let visibilityObserver = null;
  if ("IntersectionObserver" in window) {
    visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        controls.autoRotate = isVisible;
      },
      { threshold: 0.02 },
    );
    visibilityObserver.observe(viewport);
  }

  function animate() {
    if (studio.disposed) return;
    if (!viewport.isConnected) {
      studio.disposed = true;
      window.clearTimeout(resumeTimer);
      observer.disconnect();
      visibilityObserver?.disconnect();
      controls.dispose();
      if (studio.current) disposeObject(studio.current);
      renderer.dispose();
      renderer.domElement.remove();
      return;
    }
    if (isVisible) {
      controls.update();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  }
  animate();

  viewport.querySelector("[data-studio3d-loading]")?.remove();
  return studio;
}

function update(viewport, payload) {
  if (!viewport) return;
  const studio = studios.get(viewport) || createStudio(viewport);
  const nextKey = JSON.stringify({
    pieceId: payload.pieceId,
    variantId: payload.variantId,
    finish: payload.finish,
    choice: payload.choice,
    side: payload.side,
    font: payload.font,
    chainStyle: payload.chainStyle,
    text: payload.text,
    textSize: payload.textSize,
    rotateY: payload.rotateY,
    uploadedPhoto: payload.uploadedPhoto ? payload.uploadedPhoto.slice(0, 42) : "",
  });
  if (studio.payloadKey === nextKey) return;
  studio.payloadKey = nextKey;

  const next = createModel(payload);
  setOpacity(next, 0);
  studio.scene.add(next);

  const previous = studio.current;
  studio.current = next;
  const start = performance.now();
  const duration = payload.pieceId === previous?.userData?.pieceId ? 120 : 360;
  next.userData.pieceId = payload.pieceId;

  function fade(now) {
    const t = Math.min(1, (now - start) / duration);
    setOpacity(next, t);
    if (previous) setOpacity(previous, 1 - t);
    if (t < 1) {
      requestAnimationFrame(fade);
      return;
    }
    setOpacity(next, 1);
    if (previous) {
      studio.scene.remove(previous);
      disposeObject(previous);
    }
  }
  requestAnimationFrame(fade);
}

function syncFromForm(form) {
  const viewport = form?.closest(".customizer-studio")?.querySelector("[data-studio3d]");
  if (!viewport) return;
  update(viewport, payloadFromForm(form));
}

function mountAll() {
  document.querySelectorAll("#customForm").forEach(syncFromForm);
}

window.WristModeStudio3D = { mountAll, syncFromForm, update };
window.addEventListener("DOMContentLoaded", mountAll);
new MutationObserver(mountAll).observe(document.body, { childList: true, subtree: true });
