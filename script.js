const audio = document.getElementById("audio");
const lyricsEl = document.getElementById("lyrics");
const songTitleEl = document.getElementById("songTitle");
const songArtistEl = document.getElementById("songArtist");
const songSelectEl = document.getElementById("songSelect");
const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressEl = document.getElementById("progress");
const timelineEl = document.getElementById("timeline");
const timeTextEl = document.getElementById("timeText");
const startBtn = document.getElementById("startBtn");
const startScreenEl = document.getElementById("startScreen");
const fxLayerEl = document.getElementById("fxLayer");
const particleCanvas = document.getElementById("particleCanvas");
const particleCtx = particleCanvas?.getContext("2d");

const EFFECT_CLASSES = [
  "effect-fade",
  "effect-float",
  "effect-blur",
  "effect-pop",
  "effect-chorus",
  "effect-drift"
];

const DEFAULT_EFFECT = "fade";
const PARTICLE_COUNT = 42;

let currentSongIndex = 0;
let currentLyricIndex = -1;
let lyricChangeTimer = null;
let overlayTimers = [];
let playedOverlayKeys = new Set();
let particles = [];
let animationFrameId = null;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainSeconds).padStart(2, "0")}`;
}

function renderSongOptions() {
  songSelectEl.innerHTML = "";
  songs.forEach((song, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${song.title} / ${song.artist}`;
    songSelectEl.appendChild(option);
  });
}

function clearEffectClasses() {
  lyricsEl.classList.remove(...EFFECT_CLASSES);
}

function clearOverlayTimers() {
  overlayTimers.forEach((timerId) => clearTimeout(timerId));
  overlayTimers = [];
}

function resetOverlays() {
  clearOverlayTimers();
  playedOverlayKeys.clear();
  if (fxLayerEl) {
    fxLayerEl.innerHTML = "";
  }
}

function resetLyrics() {
  clearTimeout(lyricChangeTimer);
  currentLyricIndex = -1;
  clearEffectClasses();
  lyricsEl.classList.remove("show", "hide");
  lyricsEl.textContent = "";
  resetOverlays();
}

function updateSongMeta(song) {
  songTitleEl.textContent = song.title;
  songArtistEl.textContent = song.artist;
  songSelectEl.value = String(currentSongIndex);
}

function loadSong(index, shouldAutoPlay = false) {
  currentSongIndex = index;
  const song = songs[currentSongIndex];

  updateSongMeta(song);
  resetLyrics();

  audio.src = song.file;
  audio.load();

  progressEl.style.width = "0%";
  timeTextEl.textContent = "0:00 / 0:00";

  if (shouldAutoPlay) {
    audio.play().catch((error) => {
      console.error("再生エラー:", error);
    });
  }
}

function getCurrentLyricIndex(currentTime) {
  const currentSong = songs[currentSongIndex];
  return currentSong.lyrics.findIndex((line) => (
    currentTime >= line.start && currentTime < line.end
  ));
}

function getSafeEffectName(effectName) {
  if (typeof effectName !== "string") return DEFAULT_EFFECT;
  const normalized = effectName.trim().toLowerCase();
  const className = `effect-${normalized}`;
  return EFFECT_CLASSES.includes(className) ? normalized : DEFAULT_EFFECT;
}

function createSparkleBurst(options = {}) {
  if (!fxLayerEl) return;

  const count = options.count || 12;
  const spread = options.spread || 140;
  const centerX = options.x ?? 50;
  const centerY = options.y ?? 50;

  for (let i = 0; i < count; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";

    if (Math.random() > 0.72) {
      sparkle.classList.add("big");
    }

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
    const distance = spread * (0.45 + Math.random() * 0.75);

    sparkle.style.left = `${centerX}%`;
    sparkle.style.top = `${centerY}%`;
    sparkle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    sparkle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    sparkle.style.animationDuration = `${options.duration || 1000}ms`;

    fxLayerEl.appendChild(sparkle);
    sparkle.addEventListener("animationend", () => sparkle.remove());
  }
}

function createFlashOverlay(duration = 520) {
  if (!fxLayerEl) return;

  const flash = document.createElement("div");
  flash.className = "flash-overlay";
  flash.style.animationDuration = `${duration}ms`;
  fxLayerEl.appendChild(flash);
  flash.addEventListener("animationend", () => flash.remove());
}

function scheduleLineOverlays(line, lineIndex) {
  clearOverlayTimers();

  if (!line || !Array.isArray(line.overlays)) {
    return;
  }

  line.overlays.forEach((overlay, overlayIndex) => {
    if (!overlay || typeof overlay !== "object") return;

    const overlayAt = typeof overlay.at === "number" ? overlay.at : line.start;
    const delay = Math.max(0, (overlayAt - audio.currentTime) * 1000);
    const key = `${currentSongIndex}-${lineIndex}-${overlayIndex}-${overlayAt}`;

    const timerId = setTimeout(() => {
      if (playedOverlayKeys.has(key)) return;
      playedOverlayKeys.add(key);

      if (overlay.type === "sparkle") {
        createSparkleBurst({
          count: overlay.count || 14,
          spread: overlay.spread || 120,
          duration: overlay.duration || 1000,
          x: overlay.x ?? 50,
          y: overlay.y ?? 50
        });
      }

      if (overlay.type === "flash") {
        createFlashOverlay(overlay.duration || 520);
      }
    }, delay);

    overlayTimers.push(timerId);
  });
}

function showLyric(line, lineIndex) {
  clearTimeout(lyricChangeTimer);

  lyricsEl.classList.remove("show");
  lyricsEl.classList.add("hide");
  clearEffectClasses();

  const effectName = getSafeEffectName(line.effect);

  lyricChangeTimer = setTimeout(() => {
    lyricsEl.textContent = line.text;
    lyricsEl.classList.remove("hide");
    lyricsEl.classList.add(`effect-${effectName}`);
    lyricsEl.classList.add("show");
    scheduleLineOverlays(line, lineIndex);
  }, 120);
}

function clearLyric() {
  clearTimeout(lyricChangeTimer);

  lyricsEl.classList.remove("show");
  lyricsEl.classList.add("hide");

  lyricChangeTimer = setTimeout(() => {
    if (currentLyricIndex === -1) {
      lyricsEl.textContent = "";
      clearEffectClasses();
    }
  }, 260);
}

function updateLyrics() {
  const newLyricIndex = getCurrentLyricIndex(audio.currentTime);

  if (newLyricIndex === currentLyricIndex) return;

  currentLyricIndex = newLyricIndex;

  if (currentLyricIndex === -1) {
    clearLyric();
    return;
  }

  const currentSong = songs[currentSongIndex];
  const currentLyric = currentSong.lyrics[currentLyricIndex];
  showLyric(currentLyric, currentLyricIndex);
}

function updateProgress() {
  const currentTime = audio.currentTime;
  const duration = audio.duration || 0;
  const ratio = duration > 0 ? currentTime / duration : 0;

  progressEl.style.width = `${ratio * 100}%`;
  timeTextEl.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
}

function togglePlayPause() {
  if (audio.paused) {
    audio.play().catch((error) => {
      console.error("再生エラー:", error);
    });
  } else {
    audio.pause();
  }
}

function playNextSong() {
  const nextIndex = (currentSongIndex + 1) % songs.length;
  loadSong(nextIndex, true);
}

function playPrevSong() {
  const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadSong(prevIndex, true);
}

function seekAudio(event) {
  const rect = timelineEl.getBoundingClientRect();
  const positionX = event.clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, positionX / rect.width));
  const duration = audio.duration || 0;
  audio.currentTime = ratio * duration;
}

async function startPlayback() {
  startScreenEl.style.display = "none";

  try {
    await audio.play();
  } catch (error) {
    console.error("再生エラー:", error);
    startScreenEl.style.display = "flex";
  }
}

function resizeParticleCanvas() {
  if (!particleCanvas || !particleCtx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  particleCanvas.width = Math.floor(width * dpr);
  particleCanvas.height = Math.floor(height * dpr);
  particleCanvas.style.width = `${width}px`;
  particleCanvas.style.height = `${height}px`;

  particleCtx.setTransform(1, 0, 0, 1, 0, 0);
  particleCtx.scale(dpr, dpr);
}

function createParticle(width, height) {
  const size = Math.random() * 2.2 + 0.6;

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28,
    size,
    alpha: Math.random() * 0.35 + 0.08
  };
}

function initParticles() {
  if (!particleCanvas || !particleCtx) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  particles = Array.from({ length: PARTICLE_COUNT }, () =>
    createParticle(width, height)
  );
}

function updateParticles() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  for (const particle of particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;
  }
}

function drawParticles() {
  if (!particleCtx) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  particleCtx.clearRect(0, 0, width, height);

  for (const particle of particles) {
    particleCtx.beginPath();
    particleCtx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
    particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    particleCtx.fill();
  }
}

function animateParticles() {
  updateParticles();
  drawParticles();
  animationFrameId = requestAnimationFrame(animateParticles);
}

function setupParticles() {
  if (!particleCanvas || !particleCtx) return;

  resizeParticleCanvas();
  initParticles();

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  animateParticles();
}

songSelectEl.addEventListener("change", (event) => {
  const nextIndex = Number(event.target.value);
  const shouldResume = !audio.paused;
  loadSong(nextIndex, shouldResume);
});

playPauseBtn.addEventListener("click", togglePlayPause);
prevBtn.addEventListener("click", playPrevSong);
nextBtn.addEventListener("click", playNextSong);
timelineEl.addEventListener("click", seekAudio);
startBtn.addEventListener("click", startPlayback);

audio.addEventListener("timeupdate", () => {
  updateLyrics();
  updateProgress();
});

audio.addEventListener("loadedmetadata", updateProgress);

audio.addEventListener("play", () => {
  playPauseBtn.textContent = "⏸ Pause";
});

audio.addEventListener("pause", () => {
  playPauseBtn.textContent = "▶ Play";
});

audio.addEventListener("ended", () => {
  playNextSong();
});

window.addEventListener("resize", () => {
  resizeParticleCanvas();
  initParticles();
});

renderSongOptions();
loadSong(0);
setupParticles();
