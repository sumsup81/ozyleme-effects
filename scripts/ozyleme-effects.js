const MODULE_ID = "ozyleme-effects";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);
});

Hooks.on("renderApplicationV2", (app, html) => {
  const root =
    html instanceof HTMLElement
      ? html
      : html?.[0] ?? app.element;

  if (!root) return;

  const document =
    app.document ??
    app.object ??
    app.options?.document;

  const documentName = document?.documentName;
  const applicationName = app.constructor?.name;

  const isLight =
    documentName === "AmbientLight" ||
    applicationName === "AmbientLightConfig";

  const isToken =
    documentName === "Token" ||
    applicationName === "TokenConfig";

  const isTile =
    documentName === "Tile" ||
    applicationName === "TileConfig";

  if (!isLight && !isToken && !isTile) return;

  const form = root.matches?.("form")
    ? root
    : root.querySelector?.("form");

  if (!form || form.querySelector(".ozyleme-effects-panel")) return;

  if (isLight) addLightControls(form, document);
  if (isToken || isTile) addVisualEffectControls(form, document);
});

function addLightControls(form, document) {
  const fadeIn = getNumberFlag(document, "fadeIn", 0);
  const fadeOut = getNumberFlag(document, "fadeOut", 0);

  const panel = createPanel("Smooth Light Toggle", "fa-solid fa-sun");

  panel.insertAdjacentHTML(
    "beforeend",
    `
      <div class="form-group">
        <label>Fade In</label>
        <div class="form-fields">
          <input
            type="number"
            name="flags.${MODULE_ID}.fadeIn"
            value="${fadeIn}"
            min="0"
            max="60"
            step="0.1"
          >
          <span class="units">Seconds</span>
        </div>
        <p class="hint">
          How long this light takes to reach full brightness.
        </p>
      </div>

      <div class="form-group">
        <label>Fade Out</label>
        <div class="form-fields">
          <input
            type="number"
            name="flags.${MODULE_ID}.fadeOut"
            value="${fadeOut}"
            min="0"
            max="60"
            step="0.1"
          >
          <span class="units">Seconds</span>
        </div>
        <p class="hint">
          How long this light takes to switch off.
        </p>
      </div>
    `
  );

  insertPanel(form, panel);
}

function addVisualEffectControls(form, document) {
  const oldFilmEnabled = getBooleanFlag(
    document,
    "oldFilm.enabled",
    false
  );

  const oldFilmIntensity = getNumberFlag(
    document,
    "oldFilm.intensity",
    0.5
  );

  const oldFilmSpeed = getNumberFlag(
    document,
    "oldFilm.speed",
    1
  );

  const borderEnabled = getBooleanFlag(
    document,
    "border.enabled",
    false
  );

  const borderColor = getStringFlag(
    document,
    "border.color",
    "#000000"
  );

  const borderThickness = getNumberFlag(
    document,
    "border.thickness",
    4
  );

  const shadowEnabled = getBooleanFlag(
    document,
    "shadow.enabled",
    false
  );

  const shadowColor = getStringFlag(
    document,
    "shadow.color",
    "#000000"
  );

  const shadowOpacity = getNumberFlag(
    document,
    "shadow.opacity",
    0.5
  );

  const shadowDistance = getNumberFlag(
    document,
    "shadow.distance",
    8
  );

  const shadowAngle = getNumberFlag(
    document,
    "shadow.angle",
    45
  );

  const shadowBlur = getNumberFlag(
    document,
    "shadow.blur",
    4
  );

  const panel = createPanel(
    "Ozyleme Effects",
    "fa-solid fa-wand-magic-sparkles"
  );

  panel.insertAdjacentHTML(
    "beforeend",
    `
      <details>
        <summary>Old Crackling Film</summary>

        <div class="form-group">
          <label>Enabled</label>
          <div class="form-fields">
            <input
              type="checkbox"
              name="flags.${MODULE_ID}.oldFilm.enabled"
              ${oldFilmEnabled ? "checked" : ""}
            >
          </div>
        </div>

        <div class="form-group">
          <label>Intensity</label>
          <div class="form-fields">
            <input
              type="range"
              name="flags.${MODULE_ID}.oldFilm.intensity"
              value="${oldFilmIntensity}"
              min="0"
              max="1"
              step="0.05"
            >
          </div>
        </div>

        <div class="form-group">
          <label>Speed</label>
          <div class="form-fields">
            <input
              type="number"
              name="flags.${MODULE_ID}.oldFilm.speed"
              value="${oldFilmSpeed}"
              min="0.1"
              max="5"
              step="0.1"
            >
          </div>
        </div>
      </details>

      <details>
        <summary>Solid Border</summary>

        <div class="form-group">
          <label>Enabled</label>
          <div class="form-fields">
            <input
              type="checkbox"
              name="flags.${MODULE_ID}.border.enabled"
              ${borderEnabled ? "checked" : ""}
            >
          </div>
        </div>

        <div class="form-group">
          <label>Color</label>
          <div class="form-fields">
            <input
              type="color"
              name="flags.${MODULE_ID}.border.color"
              value="${borderColor}"
            >
          </div>
        </div>

        <div class="form-group">
          <label>Thickness</label>
          <div class="form-fields">
            <input
              type="number"
              name="flags.${MODULE_ID}.border.thickness"
              value="${borderThickness}"
              min="1"
              max="30"
              step="1"
            >
            <span class="units">Pixels</span>
          </div>
        </div>
      </details>

      <details>
        <summary>Drop Shadow</summary>

        <div class="form-group">
          <label>Enabled</label>
          <div class="form-fields">
            <input
              type="checkbox"
              name="flags.${MODULE_ID}.shadow.enabled"
              ${shadowEnabled ? "checked" : ""}
            >
          </div>
        </div>

        <div class="form-group">
          <label>Color</label>
          <div class="form-fields">
            <input
              type="color"
              name="flags.${MODULE_ID}.shadow.color"
              value="${shadowColor}"
            >
          </div>
        </div>

        <div class="form-group">
          <label>Opacity</label>
          <div class="form-fields">
            <input
              type="range"
              name="flags.${MODULE_ID}.shadow.opacity"
              value="${shadowOpacity}"
              min="0"
              max="1"
              step="0.05"
            >
          </div>
        </div>

        <div class="form-group">
          <label>Distance</label>
          <div class="form-fields">
            <input
              type="number"
              name="flags.${MODULE_ID}.shadow.distance"
              value="${shadowDistance}"
              min="0"
              max="100"
              step="1"
            >
            <span class="units">Pixels</span>
          </div>
        </div>

        <div class="form-group">
          <label>Direction</label>
          <div class="form-fields">
            <input
              type="number"
              name="flags.${MODULE_ID}.shadow.angle"
              value="${shadowAngle}"
              min="0"
              max="359"
              step="1"
            >
            <span class="units">Degrees</span>
          </div>
        </div>

        <div class="form-group">
          <label>Blur</label>
          <div class="form-fields">
            <input
              type="number"
              name="flags.${MODULE_ID}.shadow.blur"
              value="${shadowBlur}"
              min="0"
              max="30"
              step="1"
            >
            <span class="units">Pixels</span>
          </div>
        </div>
      </details>
    `
  );

  insertPanel(form, panel);
}

function createPanel(title, icon) {
  const panel = document.createElement("fieldset");
  panel.className = "ozyleme-effects-panel";

  panel.innerHTML = `
    <legend>
      <i class="${icon}"></i>
      ${title}
    </legend>
  `;

  return panel;
}

function insertPanel(form, panel) {
  const footer =
    form.querySelector("footer.form-footer") ??
    form.querySelector("footer");

  if (footer) footer.before(panel);
  else form.append(panel);
}

function getFlag(document, path, fallback) {
  const value = foundry.utils.getProperty(
    document.flags?.[MODULE_ID] ?? {},
    path
  );

  return value ?? fallback;
}

function getNumberFlag(document, path, fallback) {
  const value = Number(getFlag(document, path, fallback));
  return Number.isFinite(value) ? value : fallback;
}

function getBooleanFlag(document, path, fallback) {
  return Boolean(getFlag(document, path, fallback));
}

function getStringFlag(document, path, fallback) {
  const value = getFlag(document, path, fallback);
  return typeof value === "string" ? value : fallback;
}
