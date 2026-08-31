const OZYLEME_MODULE_ID = "ozyleme-effects";
const OZYLEME_BORDER_MARKER = "_ozylemeSolidBorder";

Hooks.on("canvasReady", () => {
  applyAllBorders();
});

Hooks.on("drawToken", token => {
  applyBorder(token);
});

Hooks.on("drawTile", tile => {
  applyBorder(tile);
});

Hooks.on("updateToken", document => {
  requestAnimationFrame(() => {
    applyBorder(document.object);
  });
});

Hooks.on("updateTile", document => {
  requestAnimationFrame(() => {
    applyBorder(document.object);
  });
});

function applyAllBorders() {
  for (const token of canvas.tokens?.placeables ?? []) {
    applyBorder(token);
  }

  for (const tile of canvas.tiles?.placeables ?? []) {
    applyBorder(tile);
  }
}

function applyBorder(placeable) {
  const mesh = placeable?.mesh;

  if (!mesh) return;

  removeBorder(placeable);

  const settings =
    placeable.document?.flags?.[OZYLEME_MODULE_ID]?.border;

  if (!settings?.enabled) return;

  const FilterClass =
    foundry.canvas.rendering.filters.OutlineOverlayFilter;

  if (!FilterClass) return;

  const outlineColor = convertHexColor(
    settings.color,
    "#000000"
  );

  const thickness = clampNumber(
    settings.thickness,
    1,
    30,
    4
  );

  const outline = FilterClass.create({
    knockout: false,
    wave: false,
    outlineColor
  });

  outline[OZYLEME_BORDER_MARKER] = true;
  outline.animated = false;
  outline.wave = false;
  outline.thickness = thickness;

  mesh.filters = [
    ...(mesh.filters ?? []),
    outline
  ];
}

function removeBorder(placeable) {
  const mesh = placeable?.mesh;

  if (!mesh?.filters?.length) return;

  const retainedFilters = [];
  const removedFilters = [];

  for (const filter of mesh.filters) {
    if (filter?.[OZYLEME_BORDER_MARKER]) {
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

function convertHexColor(value, fallback) {
  const color =
    typeof value === "string"
      ? value
      : fallback;

  const normalized = color
    .replace("#", "")
    .padStart(6, "0")
    .slice(0, 6);

  const red =
    Number.parseInt(normalized.slice(0, 2), 16) / 255;

  const green =
    Number.parseInt(normalized.slice(2, 4), 16) / 255;

  const blue =
    Number.parseInt(normalized.slice(4, 6), 16) / 255;

  if (
    !Number.isFinite(red) ||
    !Number.isFinite(green) ||
    !Number.isFinite(blue)
  ) {
    return [0, 0, 0, 1];
  }

  return [red, green, blue, 1];
}

function clampNumber(
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
