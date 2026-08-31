const OZYLEME_SHADOW_MODULE_ID = "ozyleme-effects";
const OZYLEME_SHADOW_MARKER = "_ozylemeDropShadow";

Hooks.on("canvasReady", () => {
  applyAllShadows();
});

Hooks.on("drawToken", token => {
  applyShadow(token);
});

Hooks.on("drawTile", tile => {
  applyShadow(tile);
});

Hooks.on("updateToken", document => {
  requestAnimationFrame(() => {
    applyShadow(document.object);
  });
});

Hooks.on("updateTile", document => {
  requestAnimationFrame(() => {
    applyShadow(document.object);
  });
});

function applyAllShadows() {
  for (const token of canvas.tokens?.placeables ?? []) {
    applyShadow(token);
  }

  for (const tile of canvas.tiles?.placeables ?? []) {
    applyShadow(tile);
  }
}

function applyShadow(placeable) {
  const mesh = placeable?.mesh;

  if (!mesh) return;

  removeShadow(placeable);

  const settings =
    placeable.document?.flags
      ?.[OZYLEME_SHADOW_MODULE_ID]
      ?.shadow;

  if (!settings?.enabled) return;

  const DropShadowFilter =
    PIXI.filters?.DropShadowFilter;

  if (!DropShadowFilter) return;

  const color = convertShadowColor(
    settings.color,
    "#000000"
  );

  const opacity = clampShadowNumber(
    settings.opacity,
    0,
    1,
    0.5
  );

  const distance = clampShadowNumber(
    settings.distance,
    0,
    100,
    8
  );

  const angle = clampShadowNumber(
    settings.angle,
    0,
    359,
    45
  );

  const blur = clampShadowNumber(
    settings.blur,
    0,
    30,
    4
  );

  const shadow = new DropShadowFilter({
    rotation: angle,
    distance,
    color,
    alpha: opacity,
    blur,
    quality: 2,
    shadowOnly: false
  });

  shadow[OZYLEME_SHADOW_MARKER] = true;

  mesh.filters = [
    ...(mesh.filters ?? []),
    shadow
  ];
}

function removeShadow(placeable) {
  const mesh = placeable?.mesh;

  if (!mesh?.filters?.length) return;

  const retainedFilters = [];
  const removedFilters = [];

  for (const filter of mesh.filters) {
    if (filter?.[OZYLEME_SHADOW_MARKER]) {
      removedFilters.push(filter);
    } else {
      retainedFilters.push(filter);
    }
  }

  if (removedFilters.length === 0) return;

  mesh.filters = retainedFilters;

  for (const filter of removedFilters) {
    filter.destroy?.();
  }
}

function convertShadowColor(value, fallback) {
  const color =
    typeof value === "string"
      ? value
      : fallback;

  const normalized = color
    .replace("#", "")
    .padStart(6, "0")
    .slice(0, 6);

  const parsed = Number.parseInt(
    normalized,
    16
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0x000000;
}

function clampShadowNumber(
  value,
  minimum,
  maximum,
  fallback
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(minimum, number)
  );
}
