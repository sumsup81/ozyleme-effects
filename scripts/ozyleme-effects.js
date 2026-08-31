const MODULE_ID = "smooth-light-fades";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);
});

Hooks.on("renderApplicationV2", (app, element) => {
  if (app.constructor.name !== "AmbientLightConfig") return;

  const light = app.document ?? app.object;
  if (!light) return;

  const form = element.matches?.("form")
    ? element
    : element.querySelector?.("form");

  if (!form || form.querySelector(".smooth-light-fades")) return;

  const fadeIn = Number(light.getFlag(MODULE_ID, "fadeIn") ?? 0);
  const fadeOut = Number(light.getFlag(MODULE_ID, "fadeOut") ?? 0);

  const section = document.createElement("fieldset");
  section.className = "smooth-light-fades";
  section.innerHTML = `
    <legend>
      <i class="fa-solid fa-sun"></i>
      Smooth Light Toggle
    </legend>

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
  `;

  const footer = form.querySelector("footer");
  if (footer) footer.before(section);
  else form.append(section);
});
