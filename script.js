const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const replayButton = document.getElementById("replayButton");
const lockerButton = document.getElementById("lockerButton");
const closeModalButton = document.getElementById("closeModalButton");
const boostButton = document.getElementById("boostButton");
const overlay = document.getElementById("messageOverlay");
const messageEyebrow = document.getElementById("messageEyebrow");
const messageTitle = document.getElementById("messageTitle");
const messageBody = document.getElementById("messageBody");
const commentaryText = document.getElementById("commentaryText");
const feedList = document.getElementById("feedList");
const alabamaScore = document.getElementById("alabamaScore");
const tennesseeScore = document.getElementById("tennesseeScore");
const quarterClock = document.getElementById("quarterClock");
const downText = document.getElementById("downText");
const driveText = document.getElementById("driveText");
const playCall = document.getElementById("playCall");
const streakValue = document.getElementById("streakValue");
const lockerText = document.getElementById("lockerText");
const videoModal = document.getElementById("videoModal");
const replayFrame = document.getElementById("replayFrame");

const FIELD = {
  left: 70,
  right: 890,
  top: 36,
  bottom: 504,
  goalLineTop: 114,
  goalLineBottom: 426,
};

const difficultyConfig = {
  kid: {
    throwDelay: 2.35,
    defenderSpeed: 260,
    burstMultiplier: 1.42,
    hintMode: "always",
    revealLead: 1.3,
    interceptionRadius: 28,
    subtitle: "The danger route stays lit. Great for instant wins.",
  },
  rivalry: {
    throwDelay: 2.1,
    defenderSpeed: 245,
    burstMultiplier: 1.32,
    hintMode: "late",
    revealLead: 0.55,
    interceptionRadius: 24,
    subtitle: "The route tips late. Enough time to gloat if you read it.",
  },
  chaos: {
    throwDelay: 1.92,
    defenderSpeed: 236,
    burstMultiplier: 1.25,
    hintMode: "none",
    revealLead: 0,
    interceptionRadius: 22,
    subtitle: "No extra help. Read the QB and ruin the throw yourself.",
  },
};

const playbook = [
  {
    name: "Pylon Poison",
    kidHint: "Dad loves the back-right pylon throw. Sit on the fade.",
    rivalryHint: "Watch the back-right pylon.",
    chaosHint: "Trips right. Your eyes only.",
    targetIndex: 2,
    routes: [
      [[248, 392], [274, 336], [250, 250], [218, 130]],
      [[480, 398], [504, 328], [576, 248], [646, 144]],
      [[706, 392], [734, 332], [784, 230], [816, 90]],
    ],
  },
  {
    name: "Volunteer Leak",
    kidHint: "The middle route bends behind you. Guard the back line.",
    rivalryHint: "The slot is leaking across the back line.",
    chaosHint: "Bunch left. Someone is trying to disappear behind you.",
    targetIndex: 1,
    routes: [
      [[236, 392], [296, 338], [356, 276], [416, 172]],
      [[462, 400], [500, 320], [560, 206], [620, 108]],
      [[680, 392], [660, 328], [630, 256], [588, 170]],
    ],
  },
  {
    name: "Orange Heartbreak",
    kidHint: "The left corner route is the trap. Stay high and inside.",
    rivalryHint: "Cheat toward the left flag and drive on the ball.",
    chaosHint: "Boundary route left. Make the quarterback regret it.",
    targetIndex: 0,
    routes: [
      [[252, 392], [230, 332], [188, 238], [146, 96]],
      [[478, 398], [468, 316], [440, 234], [390, 126]],
      [[708, 392], [742, 340], [794, 266], [830, 188]],
    ],
  },
];

const interceptionCalls = [
  "Zabien Brown mode activated. Dad would like to review the tape. Again.",
  "That ball belonged to Alabama the whole time.",
  "Picked in the paint. The family group chat is about to get ugly.",
  "Tennessee thought they had six. Instead they got a lifetime of replay pain.",
];

const touchdownCalls = [
  "Tennessee sneaks one in. Dad is absolutely going to bring this up all week.",
  "You let him score. Reset immediately before he gets comfortable.",
  "The Volunteers found daylight. No replay unlocked for that nonsense.",
];

const returnCalls = [
  "Turn upfield. There is nothing but grass and dad tears in front of you.",
  "House call lane opening. Enjoy the silence on the orange sideline.",
  "Untouched down the sideline. This is getting disrespectful.",
];

const feedItems = [];

const state = {
  difficulty: "kid",
  phase: "idle",
  snapTimer: 0,
  ballFlightTimer: 0,
  ballFlightDuration: 0.92,
  gameClock: 4,
  streak: 0,
  score: {
    alabama: 17,
    tennessee: 7,
  },
  play: playbook[0],
  replayUnlocked: false,
  ball: {
    active: false,
    start: { x: 480, y: 0 },
    control: { x: 480, y: 0 },
    end: { x: 480, y: 0 },
    x: 480,
    y: 0,
  },
  shake: 0,
  particles: [],
  flash: 0,
  lastResult: null,
  replayTimerId: null,
};

const control = {
  pointerTarget: { x: 480, y: 88 },
  pointerActive: false,
  keys: new Set(),
  boostActive: false,
};

const actors = {
  defender: {
    x: 480,
    y: 88,
    radius: 15,
    label: "ZB",
    hasBall: false,
  },
  qb: {
    x: 480,
    y: 456,
    radius: 18,
  },
  receivers: [],
  chasers: [],
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatClock(seconds) {
  const clamped = Math.max(0, seconds);
  const whole = Math.floor(clamped);
  const tenths = Math.floor((clamped - whole) * 10);
  return `0:${String(whole).padStart(2, "0")}${whole === 0 ? `.${tenths}` : ""}`;
}

function buildRoute(points) {
  const segments = [];
  let totalLength = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = { x: points[index][0], y: points[index][1] };
    const end = { x: points[index + 1][0], y: points[index + 1][1] };
    const length = distance(start, end);
    totalLength += length;
    segments.push({ start, end, length });
  }

  return { points, segments, totalLength };
}

function pointOnRoute(route, progress) {
  const clamped = clamp(progress, 0, 1);
  const targetDistance = route.totalLength * clamped;
  let traveled = 0;

  for (const segment of route.segments) {
    if (traveled + segment.length >= targetDistance) {
      const segmentT = (targetDistance - traveled) / segment.length;
      return {
        x: lerp(segment.start.x, segment.end.x, segmentT),
        y: lerp(segment.start.y, segment.end.y, segmentT),
      };
    }
    traveled += segment.length;
  }

  const finalPoint = route.points[route.points.length - 1];
  return { x: finalPoint[0], y: finalPoint[1] };
}

function quadraticPoint(start, controlPoint, end, t) {
  const inverse = 1 - t;
  return {
    x: inverse * inverse * start.x + 2 * inverse * t * controlPoint.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * controlPoint.y + t * t * end.y,
  };
}

function pointInCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function pushFeed(message) {
  feedItems.unshift(message);
  feedItems.length = Math.min(feedItems.length, 4);
  feedList.innerHTML = "";

  for (const item of feedItems) {
    const node = document.createElement("li");
    node.textContent = item;
    feedList.appendChild(node);
  }
}

function setCommentary(message) {
  commentaryText.textContent = message;
  pushFeed(message);
}

function updateHud() {
  alabamaScore.textContent = String(state.score.alabama);
  tennesseeScore.textContent = String(state.score.tennessee);
  streakValue.textContent = String(state.streak);
  playCall.textContent = state.play.name;
  downText.textContent = state.phase === "return" ? "HOUSE CALL" : "3rd & Goal";

  if (state.phase === "return") {
    quarterClock.textContent = "RUN IT BACK";
    driveText.textContent = "One clean lane to the house";
    return;
  }

  if (state.phase === "resolved") {
    quarterClock.textContent = state.lastResult === "pickSix" ? "HALFTIME CHAOS" : "HALFTIME";
    driveText.textContent = state.lastResult === "pickSix" ? "The replay booth is open" : "Dad found a touchdown";
    return;
  }

  quarterClock.textContent = `2Q | ${formatClock(state.gameClock)}`;

  const hintKey = state.difficulty === "kid"
    ? "kidHint"
    : state.difficulty === "rivalry"
      ? "rivalryHint"
      : "chaosHint";
  driveText.textContent = state.play[hintKey];
}

function showOverlay(config) {
  messageEyebrow.textContent = config.eyebrow;
  messageTitle.textContent = config.title;
  messageBody.textContent = config.body;
  startButton.textContent = config.startLabel ?? "Run it back";
  replayButton.hidden = !config.showReplay;
  overlay.classList.remove("is-hidden");
}

function hideOverlay() {
  overlay.classList.add("is-hidden");
}

function selectNewPlay() {
  const previousName = state.play?.name;
  const options = playbook.filter((play) => play.name !== previousName);
  state.play = options.length ? randomItem(options) : playbook[0];
}

function createReceiver(route, index) {
  const builtRoute = buildRoute(route);
  const startPoint = builtRoute.points[0];
  return {
    index,
    route: builtRoute,
    progress: 0,
    speed: 150 + index * 6,
    x: startPoint[0],
    y: startPoint[1],
    radius: 14,
    label: index === state.play.targetIndex ? "TRG" : "WR",
  };
}

function resetActors() {
  actors.defender.x = 480;
  actors.defender.y = 88;
  actors.defender.hasBall = false;
  actors.qb.x = 480;
  actors.qb.y = 456;
  actors.receivers = state.play.routes.map((route, index) => createReceiver(route, index));
  actors.chasers = [];
  state.ball.active = false;
  state.ball.x = actors.qb.x;
  state.ball.y = actors.qb.y - 16;
  control.pointerTarget.x = 480;
  control.pointerTarget.y = 88;
}

function startRound() {
  if (state.replayTimerId) {
    window.clearTimeout(state.replayTimerId);
    state.replayTimerId = null;
  }
  closeReplayModal();
  selectNewPlay();
  state.phase = "live";
  state.snapTimer = 0;
  state.gameClock = 4;
  state.lastResult = null;
  state.score.alabama = 17;
  state.score.tennessee = 7;
  state.flash = 0;
  state.shake = 0;
  state.particles = [];
  resetActors();
  hideOverlay();
  updateHud();
  setCommentary(difficultyConfig[state.difficulty].subtitle);
}

function launchBall() {
  const targetReceiver = actors.receivers[state.play.targetIndex];
  const endPoint = pointOnRoute(targetReceiver.route, 1);
  const controlPoint = {
    x: (actors.qb.x + endPoint.x) * 0.5,
    y: Math.min(actors.qb.y, endPoint.y) - 170,
  };

  state.ball.active = true;
  state.ballFlightTimer = 0;
  state.ball.start = { x: actors.qb.x, y: actors.qb.y - 12 };
  state.ball.control = controlPoint;
  state.ball.end = endPoint;
  state.ball.x = state.ball.start.x;
  state.ball.y = state.ball.start.y;

  const call = state.difficulty === "chaos"
    ? "Ball is out. Read the arc and go steal it."
    : "Ball up. Drive through the catch point.";

  setCommentary(call);
}

function setReturnChasers() {
  actors.chasers = actors.receivers.map((receiver, index) => ({
    x: receiver.x,
    y: receiver.y,
    radius: 12,
    speed: 118 + index * 6,
  }));
}

function spawnParticles(x, y, palette, count = 22) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 170;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8 + Math.random() * 0.6,
      size: 4 + Math.random() * 6,
      color: palette[index % palette.length],
    });
  }
}

function enterReturn() {
  state.phase = "return";
  state.ball.active = false;
  actors.defender.hasBall = true;
  control.pointerTarget.x = 480;
  control.pointerTarget.y = 470;
  setReturnChasers();
  state.shake = 8;
  state.flash = 1;
  state.streak += 1;
  updateHud();
  spawnParticles(actors.defender.x, actors.defender.y, ["#f4c969", "#8c1d31", "#fff7ea"], 28);
  setCommentary(randomItem(interceptionCalls));
}

function finishPickSix() {
  state.phase = "resolved";
  state.lastResult = "pickSix";
  state.score.alabama = 23;
  state.replayUnlocked = true;
  lockerButton.disabled = false;
  lockerButton.textContent = "Watch the clip";
  lockerText.textContent = "Unlocked. Time to make Dad watch the real thing one more time.";
  updateHud();
  spawnParticles(actors.defender.x, actors.defender.y, ["#f4c969", "#8c1d31", "#ffffff"], 34);
  showOverlay({
    eyebrow: "Pick-six secured",
    title: "House Call. Dad Is Cooked.",
    body: "You jumped it in the end zone and finished the job. Replay booth opening now, then you can run it back.",
    startLabel: "Run it back",
    showReplay: true,
  });
  setCommentary(randomItem(returnCalls));

  state.replayTimerId = window.setTimeout(() => {
    state.replayTimerId = null;
    openReplayModal({ autoPlayMuted: true });
  }, 900);
}

function finishTouchdown() {
  state.phase = "resolved";
  state.lastResult = "touchdown";
  state.score.tennessee = 13;
  state.streak = 0;
  updateHud();
  spawnParticles(state.ball.end.x, state.ball.end.y, ["#f36c21", "#fff4e8"], 24);
  showOverlay({
    eyebrow: "Dad got loose",
    title: "Tennessee Snuck One In",
    body: "No replay unlocked on that drive. Reset the defense and make the next throw miserable.",
    startLabel: "Try again",
    showReplay: state.replayUnlocked,
  });
  setCommentary(randomItem(touchdownCalls));
}

function maybeInterceptBall() {
  const config = difficultyConfig[state.difficulty];
  const defenderPoint = { x: actors.defender.x, y: actors.defender.y };
  const ballPoint = { x: state.ball.x, y: state.ball.y };
  const touchDistance = distance(defenderPoint, ballPoint);

  if (touchDistance <= config.interceptionRadius + actors.defender.radius) {
    enterReturn();
    return true;
  }

  return false;
}

function updateReceivers(delta) {
  for (const receiver of actors.receivers) {
    const liveSpeed = receiver.speed / receiver.route.totalLength;
    const pace = state.phase === "return" ? 0.1 : 1;
    receiver.progress = clamp(receiver.progress + delta * liveSpeed * pace, 0, 1);
    const nextPoint = pointOnRoute(receiver.route, receiver.progress);
    receiver.x = nextPoint.x;
    receiver.y = nextPoint.y;
  }
}

function updateDefender(delta) {
  if (state.phase !== "live" && state.phase !== "return") {
    return;
  }

  const config = difficultyConfig[state.difficulty];
  let axisX = 0;
  let axisY = 0;

  if (control.keys.has("ArrowLeft") || control.keys.has("a")) {
    axisX -= 1;
  }
  if (control.keys.has("ArrowRight") || control.keys.has("d")) {
    axisX += 1;
  }
  if (control.keys.has("ArrowUp") || control.keys.has("w")) {
    axisY -= 1;
  }
  if (control.keys.has("ArrowDown") || control.keys.has("s")) {
    axisY += 1;
  }

  let velocityX = 0;
  let velocityY = 0;

  if (axisX !== 0 || axisY !== 0) {
    const length = Math.hypot(axisX, axisY) || 1;
    velocityX = axisX / length;
    velocityY = axisY / length;
  } else {
    const dx = control.pointerTarget.x - actors.defender.x;
    const dy = control.pointerTarget.y - actors.defender.y;
    const length = Math.hypot(dx, dy);

    if (length > 5) {
      velocityX = dx / length;
      velocityY = dy / length;
    }
  }

  const burstReady = state.ball.active || state.phase === "return";
  const burst = burstReady && (control.keys.has(" ") || control.boostActive);
  const speed = config.defenderSpeed * (burst ? config.burstMultiplier : 1);

  actors.defender.x = clamp(actors.defender.x + velocityX * speed * delta, FIELD.left + 18, FIELD.right - 18);
  actors.defender.y = clamp(actors.defender.y + velocityY * speed * delta, FIELD.top + 18, FIELD.bottom - 18);
}

function updateReturnChasers(delta) {
  if (state.phase !== "return") {
    return;
  }

  for (const chaser of actors.chasers) {
    const dx = actors.defender.x - chaser.x;
    const dy = actors.defender.y - chaser.y;
    const length = Math.hypot(dx, dy) || 1;
    chaser.x += (dx / length) * chaser.speed * delta;
    chaser.y += (dy / length) * chaser.speed * delta;
  }

  if (actors.defender.y >= FIELD.goalLineBottom + 10) {
    finishPickSix();
  }
}

function updateParticles(delta) {
  state.particles = state.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * delta,
      y: particle.y + particle.vy * delta,
      vy: particle.vy + 160 * delta,
      life: particle.life - delta,
    }))
    .filter((particle) => particle.life > 0);

  state.flash = Math.max(0, state.flash - delta * 1.6);
  state.shake = Math.max(0, state.shake - delta * 12);
}

function updateBall(delta) {
  if (!state.ball.active) {
    return;
  }

  state.ballFlightTimer += delta;
  const progress = clamp(state.ballFlightTimer / state.ballFlightDuration, 0, 1);
  const point = quadraticPoint(state.ball.start, state.ball.control, state.ball.end, progress);
  state.ball.x = point.x;
  state.ball.y = point.y;

  if (maybeInterceptBall()) {
    return;
  }

  if (progress >= 1) {
    finishTouchdown();
  }
}

function updateGame(delta) {
  updateParticles(delta);
  updateHud();

  if (state.phase === "idle" || state.phase === "resolved") {
    return;
  }

  updateReceivers(delta);
  updateDefender(delta);

  if (state.phase === "live") {
    state.snapTimer += delta;
    state.gameClock = Math.max(0, 4 - state.snapTimer);

    if (!state.ball.active && state.snapTimer >= difficultyConfig[state.difficulty].throwDelay) {
      launchBall();
    }

    updateBall(delta);
  } else if (state.phase === "return") {
    updateReturnChasers(delta);
  }
}

function routeHighlightAlpha(index) {
  const config = difficultyConfig[state.difficulty];

  if (index !== state.play.targetIndex) {
    return 0.28;
  }

  if (state.phase === "idle" || state.phase === "resolved") {
    return config.hintMode === "none" ? 0.24 : 0.78;
  }

  if (config.hintMode === "always") {
    return 0.88;
  }

  if (config.hintMode === "late") {
    return state.snapTimer >= config.throwDelay - config.revealLead ? 0.82 : 0.22;
  }

  return 0.2;
}

function drawField() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }

  const fieldGradient = ctx.createLinearGradient(0, FIELD.top, 0, FIELD.bottom);
  fieldGradient.addColorStop(0, "#0d5b39");
  fieldGradient.addColorStop(0.52, "#12653f");
  fieldGradient.addColorStop(1, "#0a452a");

  ctx.fillStyle = fieldGradient;
  ctx.fillRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top);

  ctx.fillStyle = "#7f1730";
  ctx.fillRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.goalLineTop - FIELD.top);

  ctx.fillStyle = "#d55b1c";
  ctx.fillRect(FIELD.left, FIELD.goalLineBottom, FIELD.right - FIELD.left, FIELD.bottom - FIELD.goalLineBottom);

  ctx.globalAlpha = 0.14;
  for (let x = FIELD.left - 40; x < FIELD.right + 80; x += 54) {
    ctx.fillStyle = "#fff8ee";
    ctx.fillRect(x, FIELD.top, 20, FIELD.goalLineTop - FIELD.top);
    ctx.fillRect(x + 22, FIELD.goalLineBottom, 20, FIELD.bottom - FIELD.goalLineBottom);
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(255,255,255,0.74)";
  ctx.lineWidth = 3;
  ctx.strokeRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top);

  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(FIELD.left, FIELD.goalLineTop);
  ctx.lineTo(FIELD.right, FIELD.goalLineTop);
  ctx.moveTo(FIELD.left, FIELD.goalLineBottom);
  ctx.lineTo(FIELD.right, FIELD.goalLineBottom);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  for (let index = 1; index <= 5; index += 1) {
    const y = lerp(FIELD.goalLineTop, FIELD.goalLineBottom, index / 6);
    ctx.beginPath();
    ctx.moveTo(FIELD.left, y);
    ctx.lineTo(FIELD.right, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.5;
  for (let y = FIELD.goalLineTop + 12; y < FIELD.goalLineBottom; y += 46) {
    for (let side = 0; side < 2; side += 1) {
      const x = side === 0 ? FIELD.left + 180 : FIELD.right - 200;
      for (let index = 0; index < 6; index += 1) {
        const markX = x + index * 6;
        ctx.beginPath();
        ctx.moveTo(markX, y);
        ctx.lineTo(markX, y + 12);
        ctx.stroke();
      }
    }
  }

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = '700 42px "Bebas Neue"';
  ctx.textAlign = "center";
  ctx.fillText("BAMA MODE", (FIELD.left + FIELD.right) / 2, 86);
  ctx.fillText("VOL LAND", (FIELD.left + FIELD.right) / 2, 474);

  drawRoutes();
  drawPlayers();
  drawParticles();

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 244, 216, ${state.flash * 0.38})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.restore();
}

function drawRoutes() {
  actors.receivers.forEach((receiver, index) => {
    ctx.beginPath();
    receiver.route.points.forEach((point, pointIndex) => {
      const [x, y] = point;
      if (pointIndex === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    const alpha = routeHighlightAlpha(index);
    ctx.lineWidth = index === state.play.targetIndex ? 5 : 3;
    ctx.setLineDash(index === state.play.targetIndex ? [16, 10] : [10, 10]);
    ctx.strokeStyle = index === state.play.targetIndex
      ? `rgba(244, 201, 105, ${alpha})`
      : `rgba(255, 255, 255, ${alpha})`;
    ctx.stroke();
    ctx.setLineDash([]);

    const finalPoint = receiver.route.points[receiver.route.points.length - 1];
    ctx.beginPath();
    ctx.arc(finalPoint[0], finalPoint[1], 10, 0, Math.PI * 2);
    ctx.fillStyle = index === state.play.targetIndex
      ? `rgba(244, 201, 105, ${Math.max(alpha, 0.34)})`
      : "rgba(255,255,255,0.18)";
    ctx.fill();
  });
}

function drawPlayer(x, y, radius, fill, stroke, label) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  ctx.stroke();

  ctx.fillStyle = "#fffaf2";
  ctx.font = '700 12px "Manrope"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 0.5);
}

function drawPlayers() {
  ctx.beginPath();
  ctx.arc(control.pointerTarget.x, control.pointerTarget.y, 18, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawPlayer(actors.qb.x, actors.qb.y, actors.qb.radius, "#f36c21", "#fff4e8", "QB");

  for (const receiver of actors.receivers) {
    drawPlayer(receiver.x, receiver.y, receiver.radius, "#f36c21", "#fff4e8", "WR");
  }

  for (const chaser of actors.chasers) {
    drawPlayer(chaser.x, chaser.y, chaser.radius, "#f36c21", "#fff4e8", "CH");
  }

  drawPlayer(actors.defender.x, actors.defender.y, actors.defender.radius, "#8c1d31", "#f4c969", actors.defender.hasBall ? "INT" : "ZB");

  if (state.ball.active) {
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#7a4d1b";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#f3ddbd";
    ctx.stroke();
  } else if (actors.defender.hasBall) {
    ctx.beginPath();
    ctx.ellipse(actors.defender.x + 12, actors.defender.y - 10, 8, 5, -0.45, 0, Math.PI * 2);
    ctx.fillStyle = "#7a4d1b";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#f3ddbd";
    ctx.stroke();
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function openReplayModal(options = {}) {
  if (!state.replayUnlocked) {
    return;
  }

  const { autoPlayMuted = false } = options;
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    playsinline: "1",
  });

  if (autoPlayMuted) {
    params.set("mute", "1");
  }

  replayFrame.src = `https://www.youtube-nocookie.com/embed/PFGQqB8SnEY?${params.toString()}`;
  videoModal.hidden = false;
}

function setBoostState(isActive) {
  control.boostActive = isActive;
  boostButton.classList.toggle("active", isActive);
}

function closeReplayModal() {
  if (state.replayTimerId) {
    window.clearTimeout(state.replayTimerId);
    state.replayTimerId = null;
  }
  replayFrame.src = "";
  videoModal.hidden = true;
}

function setDifficulty(mode) {
  state.difficulty = mode;

  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.classList.toggle("active", button.dataset.difficulty === mode);
  });

  updateHud();
  if (state.phase === "idle" || state.phase === "resolved") {
    setCommentary(difficultyConfig[mode].subtitle);
  }
}

canvas.addEventListener("pointerdown", (event) => {
  const point = pointInCanvas(event);
  control.pointerActive = true;
  control.pointerTarget.x = point.x;
  control.pointerTarget.y = point.y;
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerType === "mouse" || control.pointerActive) {
    const point = pointInCanvas(event);
    control.pointerTarget.x = point.x;
    control.pointerTarget.y = point.y;
  }
});

canvas.addEventListener("pointerup", () => {
  control.pointerActive = false;
});

canvas.addEventListener("pointerleave", () => {
  control.pointerActive = false;
});

window.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key) || ["w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
  }

  control.keys.add(key);

  if (event.key === "Escape") {
    closeReplayModal();
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  control.keys.delete(key);
});

boostButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  setBoostState(true);
});

["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
  boostButton.addEventListener(eventName, () => setBoostState(false));
});

startButton.addEventListener("click", startRound);
replayButton.addEventListener("click", openReplayModal);
lockerButton.addEventListener("click", openReplayModal);
closeModalButton.addEventListener("click", closeReplayModal);
videoModal.querySelector("[data-close-modal]").addEventListener("click", closeReplayModal);

document.querySelectorAll("[data-difficulty]").forEach((button) => {
  button.addEventListener("click", () => setDifficulty(button.dataset.difficulty));
});

let lastFrame = performance.now();

function frame(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.033);
  lastFrame = now;
  updateGame(delta);
  drawField();
  requestAnimationFrame(frame);
}

showOverlay({
  eyebrow: "Bryant-Denny panic mode",
  title: "Protect the end zone. Break Dad's heart.",
  body: "Pick a mode, snap the ball, and make Tennessee regret throwing into your side of the field.",
  startLabel: "Snap the ball",
  showReplay: false,
});

setDifficulty("kid");
resetActors();
updateHud();
setCommentary("Pick Kid Mode for the fastest first interception.");
requestAnimationFrame(frame);

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Silent failure is fine for simple local hosting or unsupported contexts.
    });
  });
}
