const OZYLEME_MODULE_ID = "ozyleme-effects";
const BORDER_CONTAINER_NAME = "ozyleme-solid-border";

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

Hooks.on("deleteToken", document => {
  removeBorder(document.object);
});

Hooks.on("deleteTile", document => {
  removeBorder(document.object);
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
  if (!placeable?.document) return;

  removeBorder(placeable);

  const settings =
    placeable.document.flags?.[OZYLEME_MODULE_ID]?.border;

  if (!settings?.enabled) return;

  const source = placeable.mesh;
  const parent = source?.parent;

  if (!source?.texture || !parent) return;

  const thickness = clampNumber(
    settings.thickness,
    1,
    30,
    4
  );

  const color = parseColor(
    settings.color,
    0x000000
  );

  const border = new PIXI.Container();
  border.name = BORDER_CONTAINER_NAME;
  border.eventMode = "none";
  border.interactiveChildren = false;

  const points = createBorderPoints(thickness);

  for (const point of points) {
    const sprite = createBorderSprite(
      source,
      point.x,
      point.y,
      color
    );

    border.addChild(sprite);
  }

  const sourceIndex = parent.getChildIndex(source);

  if (sourceIndex >= 0) {
    parent.addChildAt(border, sourceIndex);
  } else {
    parent.addChild(border);
  }

  placeable._ozylemeBorder = border;
}

function createBorderPoints(thickness) {
  const points = [];
  const steps = Math.max(
    16,
    Math.ceil(thickness * 4)
  );

  for (let index = 0; index < steps; index++) {
    const angle =
      (Math.PI * 2 * index) / steps;

    points.push({
      x: Math.cos(angle) * thickness,
      y: Math.sin(angle) * thickness
    });
  }

  return points;
}

function createBorderSprite(
  source,
  offsetX,
  offsetY,
  color
) {
  const sprite = PIXI.Sprite.from(source.texture);

  const anchorX = source.anchor?.x ?? 0.5;
  const anchorY = source.anchor?.y ?? 0.5;

  sprite.anchor.set(anchorX, anchorY);

  const positionX = source.position?.x ?? source.x ?? 0;
  const positionY = source.position?.y ?? source.y ?? 0;

  sprite.position.set(
    positionX + offsetX,
    positionY + offsetY
  );

  const scaleX = source.scale?.x ?? 1;
  const scaleY = source.scale?.y ?? 1;

  sprite.scale.set(scaleX, scaleY);

  sprite.rotation = source.rotation ?? 0;
  sprite.alpha = source.alpha ?? 1;
  sprite.tint = color;
  sprite.eventMode = "none";
  sprite.blendMode = "normal";

  if (source.skew && sprite.skew) {
    sprite.skew.set(
      source.skew.x ?? 0,
      source.skew.y ?? 0
    );
  }

  return sprite;
}

function removeBorder(placeable) {
  const border = placeable?._ozylemeBorder;

  if (!border) return;

  border.destroy({
    children: true
  });

  delete placeable._ozylemeBorder;
}

function parseColor(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.replace("#", "");
  const parsed = Number.parseInt(
    normalized,
    16
  );

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
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
