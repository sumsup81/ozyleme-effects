const OZYLEME_LIGHTS_MODULE_ID = "ozyleme-effects";
const OZYLEME_LIGHTS_SOCKET = `module.${OZYLEME_LIGHTS_MODULE_ID}`;

const ozylemeLightAnimations = new Map();

Hooks.once("ready", () => {
  game.socket.on(OZYLEME_LIGHTS_SOCKET, handleLightSocket);
});

Hooks.on(
  "preUpdateAmbientLight",
  (lightDocument, changes, options, userId) => {
    if (options?.ozylemeEffectsBypass) return;

    if (!Object.hasOwn(changes, "hidden")) return;

    const turningOff = changes.hidden === true;

    if (turningOff === lightDocument.hidden) return;

    const flagName = turningOff ? "fadeOut" : "fadeIn";

    const durationSeconds = Number(
      lightDocument.getFlag(
        OZYLEME_LIGHTS_MODULE_ID,
        flagName
      ) ?? 0
    );

    if (!Number.isFinite(durationSeconds)) return;
    if (durationSeconds <= 0) return;

    performLightToggle(
      lightDocument,
      turningOff,
      durationSeconds
    ).catch((error) => {
      console.error(
        `${OZYLEME_LIGHTS_MODULE_ID} | Light fade failed`,
        error
      );

      lightDocument.update(
        {
          hidden: turningOff
        },
        {
          ozylemeEffectsBypass: true
        }
      );
    });

    return false;
  }
);

async function performLightToggle(
  lightDocument,
  turningOff,
  durationSeconds
) {
  const sceneId = lightDocument.parent?.id;
  const lightId = lightDocument.id;
  const duration = durationSeconds * 1000;

  if (!sceneId || !lightId) return;

  cancelLightAnimation(sceneId, lightId);

  if (turningOff) {
    await fadeLightOut(
      lightDocument,
      sceneId,
      lightId,
      duration
    );
  } else {
    await fadeLightIn(
      lightDocument,
      sceneId,
      lightId,
      duration
    );
  }
}

async function fadeLightOut(
  lightDocument,
  sceneId,
  lightId,
  duration
) {
  const placeable = getLightPlaceable(sceneId, lightId);

  const startAlpha =
    Number(placeable?.lightSource?.data?.alpha) ||
    Number(lightDocument.config?.alpha) ||
    1;

  broadcastLightAnimation({
    sceneId,
    lightId,
    startAlpha,
    endAlpha: 0,
    duration
  });

  await animateLight({
    sceneId,
    lightId,
    startAlpha,
    endAlpha: 0,
    duration
  });

  await lightDocument.update(
    {
      hidden: true
    },
    {
      ozylemeEffectsBypass: true
    }
  );
}

async function fadeLightIn(
  lightDocument,
  sceneId,
  lightId,
  duration
) {
  const targetAlpha =
    Number(lightDocument.config?.alpha) || 1;

  await lightDocument.update(
    {
      hidden: false,
      "config.alpha": 0
    },
    {
      ozylemeEffectsBypass: true
    }
  );

  await waitForLightPlaceable(sceneId, lightId);

  broadcastLightAnimation({
    sceneId,
    lightId,
    startAlpha: 0,
    endAlpha: targetAlpha,
    duration
  });

  await animateLight({
    sceneId,
    lightId,
    startAlpha: 0,
    endAlpha: targetAlpha,
    duration
  });

  await lightDocument.update(
    {
      "config.alpha": targetAlpha
    },
    {
      ozylemeEffectsBypass: true
    }
  );
}

function broadcastLightAnimation(data) {
  game.socket.emit(
    OZYLEME_LIGHTS_SOCKET,
    {
      type: "animateLight",
      senderId: game.user.id,
      ...data
    }
  );
}

function handleLightSocket(message) {
  if (message?.type !== "animateLight") return;
  if (message.senderId === game.user.id) return;

  animateLight({
    sceneId: message.sceneId,
    lightId: message.lightId,
    startAlpha: message.startAlpha,
    endAlpha: message.endAlpha,
    duration: message.duration
  }).catch((error) => {
    console.error(
      `${OZYLEME_LIGHTS_MODULE_ID} | Remote light fade failed`,
      error
    );
  });
}

function animateLight({
  sceneId,
  lightId,
  startAlpha,
  endAlpha,
  duration
}) {
  return new Promise((resolve) => {
    const animationKey = getAnimationKey(sceneId, lightId);
    const animationId = foundry.utils.randomID();

    ozylemeLightAnimations.set(
      animationKey,
      animationId
    );

    const startedAt = performance.now();

    function animateFrame(currentTime) {
      if (
        ozylemeLightAnimations.get(animationKey) !==
        animationId
      ) {
        resolve(false);
        return;
      }

      const placeable = getLightPlaceable(
        sceneId,
        lightId
      );

      const source = placeable?.lightSource;

      if (!source?.data) {
        ozylemeLightAnimations.delete(animationKey);
        resolve(false);
        return;
      }

      const elapsed = currentTime - startedAt;

      const progress =
        duration <= 0
          ? 1
          : Math.min(elapsed / duration, 1);

      const easedProgress =
        0.5 - Math.cos(progress * Math.PI) / 2;

      const currentAlpha =
        startAlpha +
        (endAlpha - startAlpha) * easedProgress;

      source.data.alpha = currentAlpha;
      source.refresh();

      if (progress < 1) {
        requestAnimationFrame(animateFrame);
        return;
      }

      ozylemeLightAnimations.delete(animationKey);
      resolve(true);
    }

    requestAnimationFrame(animateFrame);
  });
}

function getLightPlaceable(sceneId, lightId) {
  if (canvas.scene?.id !== sceneId) return null;

  const scene = game.scenes.get(sceneId);
  const lightDocument = scene?.lights.get(lightId);

  return (
    lightDocument?.object ??
    canvas.lighting?.placeables?.find(
      (light) => light.id === lightId
    ) ??
    null
  );
}

async function waitForLightPlaceable(
  sceneId,
  lightId,
  maximumFrames = 60
) {
  for (
    let frame = 0;
    frame < maximumFrames;
    frame += 1
  ) {
    const placeable = getLightPlaceable(
      sceneId,
      lightId
    );

    if (placeable?.lightSource?.data) {
      return placeable;
    }

    await nextAnimationFrame();
  }

  return null;
}

function nextAnimationFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}

function cancelLightAnimation(sceneId, lightId) {
  ozylemeLightAnimations.delete(
    getAnimationKey(sceneId, lightId)
  );
}

function getAnimationKey(sceneId, lightId) {
  return `${sceneId}.${lightId}`;
}
