const canvas = document.getElementById("fightCanvas");
const ctx = canvas.getContext("2d");

const fighterGrid = document.getElementById("fighterGrid");
const playerChoice = document.getElementById("playerChoice");
const playerBlurb = document.getElementById("playerBlurb");
const cpuChoice = document.getElementById("cpuChoice");
const cpuBlurb = document.getElementById("cpuBlurb");
const startFightButton = document.getElementById("startFightButton");
const shuffleOpponentButton = document.getElementById("shuffleOpponentButton");
const playerNameplate = document.getElementById("playerNameplate");
const cpuNameplate = document.getElementById("cpuNameplate");
const playerHealthFill = document.getElementById("playerHealthFill");
const cpuHealthFill = document.getElementById("cpuHealthFill");
const roundTimer = document.getElementById("roundTimer");
const specialName = document.getElementById("specialName");
const battleCall = document.getElementById("battleCall");
const fightOverlay = document.getElementById("fightOverlay");
const overlayEyebrow = document.getElementById("overlayEyebrow");
const overlayTitle = document.getElementById("overlayTitle");
const overlayBody = document.getElementById("overlayBody");
const overlayPrimaryButton = document.getElementById("overlayPrimaryButton");
const overlaySecondaryButton = document.getElementById("overlaySecondaryButton");

const ARENA = {
  left: 150,
  right: 1130,
  floor: 575,
  stageTop: 590,
};

const GRAVITY = 1680;
const DEFAULT_TIMER = 60;

const roster = [
  {
    id: "elephant",
    name: "Crimson Elephant",
    blurb: "Tank build. Big health bar, slow walk, brutal special.",
    primary: "#8c1d31",
    secondary: "#bcc1cb",
    accent: "#f4c969",
    shadow: "rgba(140, 29, 49, 0.28)",
    style: "elephant",
    health: 132,
    speed: 242,
    jump: 635,
    power: 1.14,
    reach: 10,
    bodyWidth: 108,
    specialName: "Tusk Stampede",
    quote: "Lowers the head and keeps charging.",
  },
  {
    id: "hound",
    name: "Volunteer Hound",
    blurb: "Fast and annoying. Quick jabs, fast feet, mean special.",
    primary: "#f36c21",
    secondary: "#fff3ea",
    accent: "#274690",
    shadow: "rgba(243, 108, 33, 0.3)",
    style: "hound",
    health: 110,
    speed: 280,
    jump: 710,
    power: 0.96,
    reach: 4,
    bodyWidth: 94,
    specialName: "Ridge Runner Spin",
    quote: "Bounces in, spins out, talks too much after.",
  },
  {
    id: "gator",
    name: "Swamp Gator",
    blurb: "Balanced bruiser with extra reach and low sweeping attacks.",
    primary: "#18734f",
    secondary: "#b7f0d4",
    accent: "#f36c21",
    shadow: "rgba(24, 115, 79, 0.28)",
    style: "gator",
    health: 118,
    speed: 258,
    jump: 660,
    power: 1.04,
    reach: 16,
    bodyWidth: 100,
    specialName: "Swamp Snap",
    quote: "Long snout, mean tail, and no mercy at mid-range.",
  },
  {
    id: "tiger",
    name: "Bayou Tiger",
    blurb: "Sharp specials, strong heavy attacks, dangerous in the air.",
    primary: "#f28d1a",
    secondary: "#fff4dc",
    accent: "#563f95",
    shadow: "rgba(86, 63, 149, 0.24)",
    style: "tiger",
    health: 114,
    speed: 266,
    jump: 690,
    power: 1.08,
    reach: 8,
    bodyWidth: 96,
    specialName: "Bayou Pounce",
    quote: "Fast launch, sharp claws, dramatic finish.",
  },
];

const rosterMap = new Map(roster.map((fighter) => [fighter.id, fighter]));

const ATTACKS = {
  jab: {
    label: "Jab",
    duration: 0.22,
    activeStart: 0.05,
    activeEnd: 0.12,
    damage: 8,
    range: 78,
    cooldown: 0.22,
    knockbackX: 220,
    knockbackY: -75,
    hitstun: 0.18,
  },
  heavy: {
    label: "Heavy",
    duration: 0.44,
    activeStart: 0.15,
    activeEnd: 0.26,
    damage: 15,
    range: 98,
    cooldown: 0.58,
    knockbackX: 290,
    knockbackY: -118,
    hitstun: 0.28,
  },
  special: {
    label: "Special",
    duration: 0.72,
    activeStart: 0.16,
    activeEnd: 0.42,
    damage: 21,
    range: 114,
    cooldown: 1.5,
    knockbackX: 360,
    knockbackY: -150,
    hitstun: 0.36,
    lungeSpeed: 340,
  },
};

const controls = {
  left: false,
  right: false,
};

const state = {
  phase: "select",
  selectedId: "elephant",
  cpuId: "hound",
  timer: DEFAULT_TIMER,
  player: null,
  cpu: null,
  commentary: "Crimson Elephant enters first. Pick a rival and start the round.",
  winner: null,
  particles: [],
  shake: 0,
  flash: 0,
  overlayMode: "select",
};

const overlayActions = {
  primary: null,
  secondary: null,
};

function fighterById(id) {
  return rosterMap.get(id) ?? roster[0];
}

function randomOpponent(excludeId) {
  const options = roster.filter((fighter) => fighter.id !== excludeId);
  return options[Math.floor(Math.random() * options.length)].id;
}

function setBattleCall(message) {
  state.commentary = message;
  battleCall.textContent = message;
}

function renderFighterGrid() {
  fighterGrid.innerHTML = roster.map((fighter) => {
    const healthPct = Math.round((fighter.health / 132) * 100);
    const speedPct = Math.round((fighter.speed / 280) * 100);
    const powerPct = Math.round((fighter.power / 1.14) * 100);

    return `
      <button class="fighter-card" type="button" data-fighter-id="${fighter.id}">
        <div class="fighter-card-head">
          <strong>${fighter.name}</strong>
          <span class="fighter-role">${fighter.id === state.selectedId ? "You" : fighter.id === state.cpuId ? "CPU" : "Open"}</span>
        </div>
        <p>${fighter.blurb}</p>
        <div class="stat-line">
          <div class="stat-row">
            <span>Health</span>
            <div class="stat-track"><div class="stat-fill" style="width:${healthPct}%"></div></div>
          </div>
          <div class="stat-row">
            <span>Speed</span>
            <div class="stat-track"><div class="stat-fill" style="width:${speedPct}%"></div></div>
          </div>
          <div class="stat-row">
            <span>Power</span>
            <div class="stat-track"><div class="stat-fill" style="width:${powerPct}%"></div></div>
          </div>
        </div>
      </button>
    `;
  }).join("");

  fighterGrid.querySelectorAll("[data-fighter-id]").forEach((button) => {
    const fighterId = button.dataset.fighterId;
    button.classList.toggle("is-selected", fighterId === state.selectedId);
    button.classList.toggle("is-opponent", fighterId === state.cpuId);
    button.disabled = state.phase === "fight";

    button.addEventListener("click", () => {
      if (state.phase === "fight") {
        return;
      }
      state.selectedId = fighterId;
      if (state.cpuId === fighterId) {
        state.cpuId = randomOpponent(fighterId);
      }
      syncRosterUi();
      showSelectionOverlay();
    });
  });
}

function syncRosterUi() {
  const player = fighterById(state.selectedId);
  const cpu = fighterById(state.cpuId);

  playerChoice.textContent = player.name;
  playerBlurb.textContent = player.quote;
  cpuChoice.textContent = cpu.name;
  cpuBlurb.textContent = cpu.quote;
  playerNameplate.textContent = player.name;
  cpuNameplate.textContent = cpu.name;
  specialName.textContent = player.specialName;
  renderFighterGrid();
}

function createFighter(template, side) {
  return {
    template,
    x: side === "left" ? 320 : 960,
    y: ARENA.floor,
    vx: 0,
    vy: 0,
    health: template.health,
    attack: null,
    cooldowns: {
      jab: 0,
      heavy: 0,
      special: 0,
    },
    grounded: true,
    facing: side === "left" ? 1 : -1,
    hitstun: 0,
    hitFlash: 0,
    aiTimer: 0.2 + Math.random() * 0.24,
    moveIntent: 0,
  };
}

function updateHud() {
  if (!state.player || !state.cpu) {
    playerHealthFill.style.width = "100%";
    cpuHealthFill.style.width = "100%";
    roundTimer.textContent = String(DEFAULT_TIMER);
    return;
  }

  playerHealthFill.style.width = `${(state.player.health / state.player.template.health) * 100}%`;
  cpuHealthFill.style.width = `${(state.cpu.health / state.cpu.template.health) * 100}%`;
  roundTimer.textContent = String(Math.max(0, Math.ceil(state.timer)));
}

function showOverlay(config) {
  overlayEyebrow.textContent = config.eyebrow;
  overlayTitle.textContent = config.title;
  overlayBody.textContent = config.body;
  overlayPrimaryButton.textContent = config.primaryLabel;
  overlayPrimaryButton.hidden = !config.primaryLabel;
  overlaySecondaryButton.textContent = config.secondaryLabel ?? "";
  overlaySecondaryButton.hidden = !config.secondaryLabel;
  overlayActions.primary = config.onPrimary ?? null;
  overlayActions.secondary = config.onSecondary ?? null;
  fightOverlay.classList.remove("is-hidden");
}

function hideOverlay() {
  fightOverlay.classList.add("is-hidden");
}

function showSelectionOverlay() {
  state.overlayMode = "select";
  showOverlay({
    eyebrow: "Mascot fight night",
    title: `${fighterById(state.selectedId).name} is ready.`,
    body: `Current rival: ${fighterById(state.cpuId).name}. Start the round or shuffle a new opponent.`,
    primaryLabel: "Start Fight",
    secondaryLabel: "Shuffle Rival",
    onPrimary: startFight,
    onSecondary: shuffleOpponent,
  });
}

function showResultOverlay() {
  const winnerName = state.winner?.template.name ?? "Nobody";
  const loserName = state.winner === state.player ? state.cpu?.template.name : state.player?.template.name;

  showOverlay({
    eyebrow: "Round finished",
    title: `${winnerName} wins.`,
    body: loserName
      ? `${winnerName} sent ${loserName} back to the tunnel. Run it back or pick a new matchup.`
      : "Time expired. Pick another round.",
    primaryLabel: "Rematch",
    secondaryLabel: "Choose Fighters",
    onPrimary: startFight,
    onSecondary: showSelectionOverlay,
  });
}

function shuffleOpponent() {
  if (state.phase === "fight") {
    return;
  }
  state.cpuId = randomOpponent(state.selectedId);
  syncRosterUi();
  showSelectionOverlay();
}

function spawnParticles(x, y, colorA, colorB, count = 18) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 180;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.45,
      size: 4 + Math.random() * 5,
      color: index % 2 === 0 ? colorA : colorB,
    });
  }
}

function startFight() {
  const playerTemplate = fighterById(state.selectedId);
  const cpuTemplate = fighterById(state.cpuId);

  state.phase = "fight";
  state.timer = DEFAULT_TIMER;
  state.player = createFighter(playerTemplate, "left");
  state.cpu = createFighter(cpuTemplate, "right");
  state.winner = null;
  state.particles = [];
  state.shake = 0;
  state.flash = 0;

  playerNameplate.textContent = playerTemplate.name;
  cpuNameplate.textContent = cpuTemplate.name;
  specialName.textContent = playerTemplate.specialName;

  hideOverlay();
  updateHud();
  setBattleCall(`${playerTemplate.name} vs ${cpuTemplate.name}. First clean knockout wins the room.`);
}

function attemptJump(fighter, isPlayer = true) {
  if (state.phase !== "fight" || !fighter || !fighter.grounded || fighter.hitstun > 0) {
    return;
  }

  fighter.grounded = false;
  fighter.vy = -fighter.template.jump;

  if (isPlayer) {
    setBattleCall(`${fighter.template.name} takes to the air.`);
  }
}

function attackName(fighter, type) {
  if (type === "special") {
    return fighter.template.specialName;
  }
  return `${fighter.template.name} ${ATTACKS[type].label}`;
}

function attemptAttack(fighter, type, isPlayer = true) {
  if (state.phase !== "fight" || !fighter || fighter.attack || fighter.hitstun > 0) {
    return false;
  }

  const config = ATTACKS[type];
  if (fighter.cooldowns[type] > 0) {
    return false;
  }

  fighter.attack = {
    type,
    timer: 0,
    hasHit: false,
  };
  fighter.cooldowns[type] = config.cooldown;

  if (isPlayer) {
    setBattleCall(`${attackName(fighter, type)} coming in hot.`);
  }

  return true;
}

function applyPlayerMovement(delta) {
  const fighter = state.player;
  if (!fighter) {
    return;
  }

  if (fighter.hitstun > 0) {
    return;
  }

  const direction = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
  fighter.moveIntent = direction;
  const maxSpeed = fighter.template.speed * (fighter.attack ? 0.42 : 1);
  const targetVelocity = direction * maxSpeed;
  fighter.vx += (targetVelocity - fighter.vx) * (fighter.grounded ? 0.22 : 0.1);

  if (direction === 0 && fighter.grounded) {
    fighter.vx *= 0.78;
  }
}

function chooseCpuAction() {
  const fighter = state.cpu;
  const target = state.player;
  if (!fighter || !target || fighter.hitstun > 0) {
    return;
  }

  const dx = target.x - fighter.x;
  const distance = Math.abs(dx);

  if (distance > 180) {
    fighter.moveIntent = Math.sign(dx);
  } else if (distance < 90) {
    fighter.moveIntent = -Math.sign(dx) * 0.15;
  } else {
    fighter.moveIntent = Math.sign(dx) * 0.6;
  }

  if (!fighter.grounded) {
    return;
  }

  const specialReady = fighter.cooldowns.special <= 0;
  const heavyReady = fighter.cooldowns.heavy <= 0;

  if (distance < 94 && Math.random() < 0.42) {
    attemptAttack(fighter, heavyReady ? "heavy" : "jab", false);
    return;
  }

  if (distance < 150 && specialReady && Math.random() < 0.34) {
    attemptAttack(fighter, "special", false);
    return;
  }

  if (distance > 210 && Math.random() < 0.12) {
    attemptJump(fighter, false);
  }
}

function applyCpuMovement(delta) {
  const fighter = state.cpu;
  if (!fighter) {
    return;
  }

  if (fighter.hitstun > 0) {
    return;
  }

  fighter.aiTimer -= delta;
  if (fighter.aiTimer <= 0) {
    fighter.aiTimer = 0.16 + Math.random() * 0.22;
    chooseCpuAction();
  }

  const maxSpeed = fighter.template.speed * (fighter.attack ? 0.38 : 1);
  const targetVelocity = fighter.moveIntent * maxSpeed;
  fighter.vx += (targetVelocity - fighter.vx) * (fighter.grounded ? 0.18 : 0.08);

  if (Math.abs(fighter.moveIntent) < 0.05 && fighter.grounded) {
    fighter.vx *= 0.8;
  }
}

function updateFighterState(fighter, delta) {
  fighter.hitstun = Math.max(0, fighter.hitstun - delta);
  fighter.hitFlash = Math.max(0, fighter.hitFlash - delta);

  Object.keys(fighter.cooldowns).forEach((key) => {
    fighter.cooldowns[key] = Math.max(0, fighter.cooldowns[key] - delta);
  });

  fighter.vy += GRAVITY * delta;
  fighter.x += fighter.vx * delta;
  fighter.y += fighter.vy * delta;

  fighter.x = Math.max(ARENA.left, Math.min(ARENA.right, fighter.x));

  if (fighter.y >= ARENA.floor) {
    fighter.y = ARENA.floor;
    fighter.vy = 0;
    fighter.grounded = true;
  } else {
    fighter.grounded = false;
  }

  if (fighter.grounded && fighter.hitstun <= 0 && !fighter.attack) {
    fighter.vx *= 0.96;
  }
}

function resolveFacing() {
  if (!state.player || !state.cpu) {
    return;
  }

  if (state.player.x <= state.cpu.x) {
    state.player.facing = 1;
    state.cpu.facing = -1;
  } else {
    state.player.facing = -1;
    state.cpu.facing = 1;
  }
}

function resolveSpacing() {
  if (!state.player || !state.cpu) {
    return;
  }

  const minimum = (state.player.template.bodyWidth + state.cpu.template.bodyWidth) * 0.38;
  const gap = state.cpu.x - state.player.x;

  if (Math.abs(gap) < minimum) {
    const correction = (minimum - Math.abs(gap)) * 0.5;
    const direction = gap >= 0 ? 1 : -1;
    state.player.x -= correction * direction;
    state.cpu.x += correction * direction;
  }

  state.player.x = Math.max(ARENA.left, Math.min(ARENA.right, state.player.x));
  state.cpu.x = Math.max(ARENA.left, Math.min(ARENA.right, state.cpu.x));
}

function resolveAttack(attacker, defender, delta) {
  if (!attacker.attack) {
    return;
  }

  const config = ATTACKS[attacker.attack.type];
  attacker.attack.timer += delta;

  if (attacker.attack.type === "special" && attacker.attack.timer <= config.activeEnd) {
    attacker.x += attacker.facing * config.lungeSpeed * delta;
    attacker.x = Math.max(ARENA.left, Math.min(ARENA.right, attacker.x));
  }

  const active = attacker.attack.timer >= config.activeStart && attacker.attack.timer <= config.activeEnd;
  if (active && !attacker.attack.hasHit) {
    const dx = defender.x - attacker.x;
    const dy = Math.abs(defender.y - attacker.y);
    const reach = config.range + attacker.template.reach;
    const inFront = Math.sign(dx) === attacker.facing || Math.abs(dx) < 20;

    if (inFront && Math.abs(dx) <= reach && dy <= 95) {
      attacker.attack.hasHit = true;
      defender.health = Math.max(0, defender.health - Math.round(config.damage * attacker.template.power));
      defender.vx = attacker.facing * config.knockbackX;
      defender.vy = config.knockbackY;
      defender.hitstun = config.hitstun;
      defender.hitFlash = 0.2;
      state.shake = 12;
      state.flash = 0.9;
      spawnParticles(defender.x, defender.y - 86, attacker.template.accent, attacker.template.primary, 20);

      setBattleCall(`${attacker.template.name} lands ${attacker.attack.type === "special" ? attacker.template.specialName : config.label}.`);

      if (defender.health <= 0 && state.phase === "fight") {
        finishRound(attacker);
      }
    }
  }

  if (attacker.attack.timer >= config.duration) {
    attacker.attack = null;
  }
}

function finishRound(winner) {
  state.phase = "result";
  state.winner = winner;
  updateHud();
  setBattleCall(`${winner.template.name} wins the round and starts talking immediately.`);
  showResultOverlay();
}

function handleTimeout() {
  if (!state.player || !state.cpu) {
    return;
  }

  if (state.player.health === state.cpu.health) {
    const winner = Math.random() > 0.5 ? state.player : state.cpu;
    finishRound(winner);
    return;
  }

  finishRound(state.player.health > state.cpu.health ? state.player : state.cpu);
}

function updateParticles(delta) {
  state.particles = state.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * delta,
      y: particle.y + particle.vy * delta,
      vy: particle.vy + 220 * delta,
      life: particle.life - delta,
    }))
    .filter((particle) => particle.life > 0);

  state.shake = Math.max(0, state.shake - delta * 26);
  state.flash = Math.max(0, state.flash - delta * 1.8);
}

function updateGame(delta) {
  updateParticles(delta);

  if (state.phase !== "fight") {
    return;
  }

  state.timer = Math.max(0, state.timer - delta);

  applyPlayerMovement(delta);
  applyCpuMovement(delta);
  updateFighterState(state.player, delta);
  updateFighterState(state.cpu, delta);
  resolveFacing();
  resolveSpacing();
  resolveAttack(state.player, state.cpu, delta);
  resolveAttack(state.cpu, state.player, delta);
  updateHud();

  if (state.timer <= 0 && state.phase === "fight") {
    handleTimeout();
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#101a40");
  sky.addColorStop(0.46, "#315cb7");
  sky.addColorStop(0.46, "#f6d6b3");
  sky.addColorStop(1, "#cf9d74");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  for (let index = 0; index < 9; index += 1) {
    ctx.fillRect(110 + index * 132, 122 + (index % 2) * 12, 88, 12);
  }

  ctx.fillStyle = "#23253f";
  ctx.fillRect(0, 210, canvas.width, 118);

  for (let row = 0; row < 4; row += 1) {
    for (let seat = 0; seat < 22; seat += 1) {
      const x = 40 + seat * 58;
      const y = 228 + row * 22;
      ctx.fillStyle = ["#f4c969", "#f36c21", "#ffffff", "#8c1d31", "#563f95"][seat % 5];
      ctx.fillRect(x, y, 14, 10);
    }
  }

  ctx.fillStyle = "#c78b54";
  ctx.fillRect(0, 328, canvas.width, 242);

  ctx.fillStyle = "#a96d3f";
  ctx.fillRect(0, ARENA.stageTop, canvas.width, canvas.height - ARENA.stageTop);

  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  for (let index = 0; index < 11; index += 1) {
    ctx.fillRect(84 + index * 112, ARENA.stageTop + 34, 64, 8);
  }

  ctx.fillStyle = "#faf3e7";
  ctx.fillRect(0, ARENA.floor + 6, canvas.width, 16);

  ctx.font = '700 44px "Bebas Neue"';
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.34)";
  ctx.fillText("MASCOT MAYHEM", canvas.width / 2, 84);
}

function drawHitEffect(fighter) {
  if (!fighter.attack) {
    return;
  }

  const config = ATTACKS[fighter.attack.type];
  if (fighter.attack.timer < config.activeStart || fighter.attack.timer > config.activeEnd) {
    return;
  }

  ctx.save();
  ctx.translate(fighter.x, fighter.y - 116);
  ctx.scale(fighter.facing, 1);
  ctx.strokeStyle = fighter.template.accent;
  ctx.lineWidth = fighter.attack.type === "special" ? 10 : 6;
  ctx.globalAlpha = 0.84;
  ctx.beginPath();
  ctx.arc(30, 10, fighter.attack.type === "special" ? 60 : 42, -0.75, 0.8);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawFighter(fighter) {
  const bob = fighter.grounded ? Math.sin(performance.now() / 180 + fighter.x * 0.01) * 2 : -fighter.vy * 0.006;
  const hitColor = fighter.hitFlash > 0 ? "#fff9ef" : fighter.template.secondary;

  ctx.save();
  ctx.translate(fighter.x, fighter.y + bob);
  ctx.scale(fighter.facing, 1);

  ctx.fillStyle = "rgba(22, 14, 10, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 10, fighter.template.bodyWidth * 0.44, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, -104);

  switch (fighter.template.style) {
    case "elephant":
      drawElephant(fighter, hitColor);
      break;
    case "hound":
      drawHound(fighter, hitColor);
      break;
    case "gator":
      drawGator(fighter, hitColor);
      break;
    case "tiger":
      drawTiger(fighter, hitColor);
      break;
    default:
      break;
  }

  drawHitEffect(fighter);
  ctx.restore();
}

function drawLimbs(primary, accent, attackOffset = 0) {
  ctx.fillStyle = primary;
  ctx.fillRect(-30, 6, 18, 54);
  ctx.fillRect(12, 6, 18, 54);
  ctx.fillRect(-48, -18, 18, 54);
  ctx.fillRect(30 + attackOffset, -22, 18, 54);

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(-39, 38, 12, 0, Math.PI * 2);
  ctx.arc(39 + attackOffset, 36, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawElephant(fighter, hitColor) {
  const attackOffset = fighter.attack ? 18 : 0;
  drawLimbs("#a8adb8", fighter.template.accent, attackOffset);

  ctx.fillStyle = fighter.template.primary;
  ctx.fillRect(-42, -30, 84, 72);

  ctx.fillStyle = hitColor;
  ctx.beginPath();
  ctx.ellipse(0, -54, 42, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#9ba2ae";
  ctx.beginPath();
  ctx.ellipse(-32, -58, 22, 26, -0.2, 0, Math.PI * 2);
  ctx.ellipse(32, -58, 22, 26, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7b828f";
  ctx.beginPath();
  ctx.ellipse(18, -32, 12, 26, -0.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff8f1";
  ctx.fillRect(10, -40, 6, 18);

  ctx.fillStyle = "#1d1a17";
  ctx.beginPath();
  ctx.arc(-12, -60, 4, 0, Math.PI * 2);
  ctx.arc(8, -60, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawHound(fighter, hitColor) {
  const attackOffset = fighter.attack ? 14 : 0;
  drawLimbs(fighter.template.primary, fighter.template.accent, attackOffset);

  ctx.fillStyle = fighter.template.primary;
  ctx.fillRect(-36, -24, 72, 68);

  ctx.fillStyle = hitColor;
  ctx.beginPath();
  ctx.ellipse(0, -58, 38, 34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fighter.template.primary;
  ctx.beginPath();
  ctx.ellipse(-18, -76, 14, 26, -0.4, 0, Math.PI * 2);
  ctx.ellipse(20, -74, 14, 26, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fffaf4";
  ctx.beginPath();
  ctx.ellipse(10, -50, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1c1712";
  ctx.beginPath();
  ctx.arc(20, -48, 4.5, 0, Math.PI * 2);
  ctx.arc(-10, -62, 4, 0, Math.PI * 2);
  ctx.arc(8, -62, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGator(fighter, hitColor) {
  const attackOffset = fighter.attack ? 20 : 0;
  drawLimbs("#157048", fighter.template.accent, attackOffset);

  ctx.fillStyle = fighter.template.primary;
  ctx.fillRect(-40, -24, 80, 68);

  ctx.fillStyle = hitColor;
  ctx.beginPath();
  ctx.ellipse(-6, -54, 34, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f5c39";
  ctx.beginPath();
  ctx.moveTo(8, -68);
  ctx.lineTo(52, -58);
  ctx.lineTo(50, -42);
  ctx.lineTo(10, -40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff9f0";
  for (let tooth = 0; tooth < 4; tooth += 1) {
    ctx.fillRect(24 + tooth * 6, -42, 2.5, 10);
  }

  ctx.fillStyle = "#1a1712";
  ctx.beginPath();
  ctx.arc(-10, -58, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fighter.template.accent;
  ctx.beginPath();
  ctx.moveTo(-52, 4);
  ctx.lineTo(-78, 18);
  ctx.lineTo(-54, 22);
  ctx.closePath();
  ctx.fill();
}

function drawTiger(fighter, hitColor) {
  const attackOffset = fighter.attack ? 16 : 0;
  drawLimbs(fighter.template.primary, fighter.template.accent, attackOffset);

  ctx.fillStyle = fighter.template.primary;
  ctx.fillRect(-38, -24, 76, 68);

  ctx.fillStyle = hitColor;
  ctx.beginPath();
  ctx.ellipse(0, -56, 38, 34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fighter.template.accent;
  ctx.beginPath();
  ctx.moveTo(-22, -82);
  ctx.lineTo(-8, -58);
  ctx.lineTo(-28, -58);
  ctx.closePath();
  ctx.moveTo(22, -82);
  ctx.lineTo(8, -58);
  ctx.lineTo(28, -58);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = fighter.template.accent;
  ctx.lineWidth = 5;
  for (let stripe = 0; stripe < 4; stripe += 1) {
    ctx.beginPath();
    ctx.moveTo(-18 + stripe * 12, -18);
    ctx.lineTo(-24 + stripe * 12, 18);
    ctx.stroke();
  }

  ctx.fillStyle = "#1c1712";
  ctx.beginPath();
  ctx.arc(-12, -60, 4, 0, Math.PI * 2);
  ctx.arc(8, -60, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life * 1.6);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }

  drawBackground();

  if (state.player) {
    drawFighter(state.player);
  }
  if (state.cpu) {
    drawFighter(state.cpu);
  }

  drawParticles();

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 248, 226, ${state.flash * 0.3})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.restore();
}

function onMovementInput(key, isActive) {
  controls[key] = isActive;
  document.querySelectorAll(`[data-hold-control="${key}"]`).forEach((button) => {
    button.classList.toggle("is-active", isActive);
  });
}

function triggerPlayerAction(action) {
  switch (action) {
    case "jump":
      attemptJump(state.player, true);
      break;
    case "jab":
    case "heavy":
    case "special":
      attemptAttack(state.player, action, true);
      break;
    default:
      break;
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (["ArrowLeft", "ArrowRight", "ArrowUp", "a", "d", "w", "j", "k", "l"].includes(key)) {
    event.preventDefault();
  }

  if (key === "ArrowLeft" || key === "a") {
    onMovementInput("left", true);
  }
  if (key === "ArrowRight" || key === "d") {
    onMovementInput("right", true);
  }
  if ((key === "ArrowUp" || key === "w") && !event.repeat) {
    triggerPlayerAction("jump");
  }
  if ((key === "j" || key === "J") && !event.repeat) {
    triggerPlayerAction("jab");
  }
  if ((key === "k" || key === "K") && !event.repeat) {
    triggerPlayerAction("heavy");
  }
  if ((key === "l" || key === "L") && !event.repeat) {
    triggerPlayerAction("special");
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === "ArrowLeft" || key === "a") {
    onMovementInput("left", false);
  }
  if (key === "ArrowRight" || key === "d") {
    onMovementInput("right", false);
  }
});

document.querySelectorAll("[data-hold-control]").forEach((button) => {
  const control = button.dataset.holdControl;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    onMovementInput(control, true);
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
    button.addEventListener(eventName, () => onMovementInput(control, false));
  });
});

document.querySelectorAll("[data-action]").forEach((button) => {
  const action = button.dataset.action;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.classList.add("is-active");
    triggerPlayerAction(action);
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
    button.addEventListener(eventName, () => button.classList.remove("is-active"));
  });
});

overlayPrimaryButton.addEventListener("click", () => {
  overlayActions.primary?.();
});

overlaySecondaryButton.addEventListener("click", () => {
  overlayActions.secondary?.();
});

startFightButton.addEventListener("click", startFight);
shuffleOpponentButton.addEventListener("click", shuffleOpponent);

let lastFrame = performance.now();

function frame(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.033);
  lastFrame = now;
  updateGame(delta);
  drawScene();
  requestAnimationFrame(frame);
}

syncRosterUi();
updateHud();
showSelectionOverlay();
requestAnimationFrame(frame);
