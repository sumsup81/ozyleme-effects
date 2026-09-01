const OZYLEME_FILM_MODULE_ID = "ozyleme-effects";

const ozylemeFilmAnimations = new Map();

Hooks.on("drawTile", (tile) => {
  applyOldFilm(tile);
});

Hooks.on("updateTile", (tileDocument) => {
  requestAnimationFrame(() => {
    const tile = tileDocument.object;

    if (tile) applyOldFilm(tile);
  });
});

Hooks.on("deleteTile", (tileDocument) => {
  removeOldFilmByDocument(tileDocument);
});

Hooks.on("canvasReady", () => {
  for (const tile of canvas.tiles.placeables) {
    applyOldFilm(tile);
  }
});

Hooks.on("canvasTearDown", () => {
  removeAllOldFilmAnimations();
});

function applyOldFilm(tile) {
  const tileDocument = tile.document;

  if (!tileDocument) return;

  const enabled = getFilmFlag(
    tileDocument,
    "oldFilm.enabled",
    false
  );

  if (!enabled) {
    removeOldFilm(tile);
    return;
  }

  const target = tile.mesh ?? tile;

  if (!target) return;

  /*
   * Remove the existing copy before applying updated
   * intensity or speed settings.
   */
  removeOldFilm(tile);

  const intensity = clampFilmNumber(
    getFilmFlag(
      tileDocument,
      "oldFilm.intensity",
      0.5
    ),
    0,
    1
  );

  const speed = clampFilmNumber(
    getFilmFlag(
      tileDocument,
      "oldFilm.speed",
      1
    ),
    0.1,
    5
  );

  const noiseAmount =
    0.04 + intensity * 0.16;

  const scratchAmount =
    0.15 + intensity * 0.8;

  const scratchDensity =
    0.12 + intensity * 0.6;

  const oldFilmFilter =
    new PIXI.filters.OldFilmFilter({
      sepia: 0,
      noise: noiseAmount,
      noiseSize: 1,
      scratch: scratchAmount,
      scratchDensity,
      scratchWidth: 1.1,
      vignetting: 0,
      vignettingAlpha: 0,
      vignettingBlur: 0,
      seed: Math.random()
    });

  oldFilmFilter._ozylemeOldFilm = true;

  const existingFilters = target.filters ?? [];

  const borderAndShadowFilters =
    existingFilters.filter(
      (filter) =>
        filter._ozylemeSolidBorder ||
        filter._ozylemeDropShadow
    );

  const otherFilters = existingFilters.filter(
    (filter) =>
      !filter._ozylemeSolidBorder &&
      !filter._ozylemeDropShadow &&
      !filter._ozylemeOldFilm
  );

  /*
   * Film affects the tile image first.
   * Border and shadow are applied afterward.
   */
  target.filters = [
    ...otherFilters,
    oldFilmFilter,
    ...borderAndShadowFilters
  ];

  /*
   * Speed 1 gives ten updates per second.
   * Higher speeds are capped at twenty updates
   * per second to protect performance.
   */
  const updateInterval = Math.max(
    50,
    Math.min(500, 100 / speed)
  );

  let lastUpdate = 0;

  const tick = () => {
    const currentTime = performance.now();

    if (
      currentTime - lastUpdate <
      updateInterval
    ) {
      return;
    }

    lastUpdate = currentTime;
    oldFilmFilter.seed = Math.random();
  };

  const animationKey = getFilmAnimationKey(
    tileDocument
  );

  ozylemeFilmAnimations.set(animationKey, {
    tick,
    target,
    oldFilmFilter
  });

  canvas.app.ticker.add(tick);
}

function removeOldFilm(tile) {
  const tileDocument = tile.document;

  if (!tileDocument) return;

  const animationKey = getFilmAnimationKey(
    tileDocument
  );

  const animation =
    ozylemeFilmAnimations.get(animationKey);

  if (animation?.tick) {
    canvas.app.ticker.remove(animation.tick);
  }

  const target =
    animation?.target ??
    tile.mesh ??
    tile;

  if (target) {
    target.filters = (target.filters ?? []).filter(
      (filter) => !filter._ozylemeOldFilm
    );
  }

  ozylemeFilmAnimations.delete(animationKey);
}

function removeOldFilmByDocument(tileDocument) {
  const animationKey = getFilmAnimationKey(
    tileDocument
  );

  const animation =
    ozylemeFilmAnimations.get(animationKey);

  if (!animation) return;

  canvas.app.ticker.remove(animation.tick);

  if (animation.target) {
    animation.target.filters =
      (animation.target.filters ?? []).filter(
        (filter) => !filter._ozylemeOldFilm
      );
  }

  ozylemeFilmAnimations.delete(animationKey);
}

function removeAllOldFilmAnimations() {
  for (
    const animation
    of ozylemeFilmAnimations.values()
  ) {
    canvas.app.ticker.remove(animation.tick);

    if (animation.target) {
      animation.target.filters =
        (animation.target.filters ?? []).filter(
          (filter) => !filter._ozylemeOldFilm
        );
    }
  }

  ozylemeFilmAnimations.clear();
}

function getFilmAnimationKey(tileDocument) {
  const sceneId =
    tileDocument.parent?.id ??
    canvas.scene?.id ??
    "unknown-scene";

  return `${sceneId}.${tileDocument.id}`;
}

function getFilmFlag(
  tileDocument,
  path,
  fallback
) {
  const value = foundry.utils.getProperty(
    tileDocument.flags?.[
      OZYLEME_FILM_MODULE_ID
    ] ?? {},
    path
  );

  return value ?? fallback;
}

function clampFilmNumber(
  value,
  minimum,
  maximum
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return minimum;
  }

  return Math.min(
    maximum,
    Math.max(minimum, number)
  );
}
