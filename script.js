const audio = document.getElementById("audio");
const lyricsEl = document.getElementById("lyrics");
const lyricsStageEl = document.getElementById("lyricsStage");
const songTitleEl = document.getElementById("songTitle");
const songArtistEl = document.getElementById("songArtist");
const songSelectEl = document.getElementById("songSelect");
const spectrumModeSelectEl = document.getElementById("spectrumModeSelect");
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
const spectrumCanvas = document.getElementById("spectrumCanvas");
const spectrumCtx = spectrumCanvas?.getContext("2d");

const EFFECT_CLASSES = [
  "effect-fade",
  "effect-float",
  "effect-blur",
  "effect-pop",
  "effect-chorus",
  "effect-drift"
];

const DEFAULT_EFFECT = "fade";
const SPECTRUM_MODES = ["wave", "bars", "dots"];
const PARTICLE_COUNT = 42;

let currentSongIndex = 0;
let currentLyricIndex = -1;
let lyricChangeTimer = null;
let particles = [];
let particleAnimationId = null;
let spectrumAnimationId = null;
let playedOverlayKeys = new Set();
let audioContext = null;
let analyserNode = null;
let sourceNode = null;
let frequencyData = null;
let spectrumReady = false;
let spectrumMode = "wave";

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainSeconds).padStart(2, "0")}`;
}

function renderSongOptions() {
  if (!songSelectEl) return;

  songSelectEl.innerHTML = "";

  songs.forEach((song, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${song.title} / ${song.artist}`;
    songSelectEl.appendChild(option);
  });
}

function clearEffectClasses() {
  if (!lyricsEl) return;
  lyricsEl.classList.remove(...EFFECT_CLASSES);
}

function getSafeEffectName(effectName) {
  if (typeof effectName !== "string") return DEFAULT_EFFECT;
  const normalized = effectName.trim().toLowerCase();
  const className = `effect-${normalized}`;
  return EFFECT_CLASSES.includes(className) ? normalized : DEFAULT_EFFECT;
}

function getSafeEffects(line) {
  if (Array.isArray(line.effects) && line.effects.length > 0) {
    return line.effects.map(getSafeEffectName);
  }

  return [getSafeEffectName(line.effect)];
}

function getSafeSpectrumMode(mode) {
  if (typeof mode !== "string") return "wave";
  const normalized = mode.trim().toLowerCase();
  return SPECTRUM_MODES.includes(normalized) ? normalized : "wave";
}

function resetOverlays() {
  playedOverlayKeys.clear();
  if (fxLayerEl) {
    fxLayerEl.innerHTML = "";
  }
}

function resetLyrics() {
  clearTimeout(lyricChangeTimer);
  currentLyricIndex = -1;
  clearEffectClasses();

  if (lyricsEl) {
    lyricsEl.classList.remove("show", "hide");
    lyricsEl.textContent = "";
  }

  resetOverlays();
}

function updateSongMeta(song) {
  if (songTitleEl) songTitleEl.textContent = song.title;
  if (songArtistEl) songArtistEl.textContent = song.artist;
  if (songSelectEl) songSelectEl.value = String(currentSongIndex);
}

async function autoPlayCurrentSong() {
  try {
    await resumeSpectrumContext();
    await audio.play();
  } catch (error) {
    console.error("再生エラー:", error);
  }
}

function loadSong(index, shouldAutoPlay = false) {
  currentSongIndex = index;
  const song = songs[currentSongIndex];

  updateSongMeta(song);
  resetLyrics();

  spectrumMode = getSafeSpectrumMode(song.spectrum);
  if (spectrumModeSelectEl) {
    spectrumModeSelectEl.value = spectrumMode;
  }

  audio.src = song.file;
  audio.load();

  if (progressEl) progressEl.style.width = "0%";
  if (timeTextEl) timeTextEl.textContent = "0:00 / 0:00";

  if (shouldAutoPlay) {
    autoPlayCurrentSong();
  }
}

function getCurrentSong() {
  return songs[currentSongIndex];
}

function getCurrentLyricIndex(currentTime) {
  const currentSong = getCurrentSong();
  if (!currentSong || !Array.isArray(currentSong.lyrics)) return -1;

  return currentSong.lyrics.findIndex((line) => (
    currentTime >= line.start && currentTime < line.end
  ));
}

function showLyric(line) {
  if (!lyricsEl) return;

  clearTimeout(lyricChangeTimer);

  lyricsEl.classList.remove("show");
  lyricsEl.classList.add("hide");
  clearEffectClasses();

  const effects = getSafeEffects(line);

  lyricChangeTimer = setTimeout(() => {
    lyricsEl.textContent = line.text;
    lyricsEl.classList.remove("hide");

    effects.forEach((effectName) => {
      lyricsEl.classList.add(`effect-${effectName}`);
    });

    lyricsEl.classList.add("show");
  }, 120);
}

function clearLyric() {
  if (!lyricsEl) return;

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

  const currentSong = getCurrentSong();
  const currentLyric = currentSong.lyrics[currentLyricIndex];
  showLyric(currentLyric);
}

function updateProgress() {
  const currentTime = audio.currentTime;
  const duration = audio.duration || 0;
  const ratio = duration > 0 ? currentTime / duration : 0;

  if (progressEl) {
    progressEl.style.width = `${ratio * 100}%`;
  }

  if (timeTextEl) {
    timeTextEl.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
  }
}

function triggerOverlay(overlay) {
  if (!overlay || typeof overlay !== "object") return;

  if (overlay.type === "sparkle") {
    createSparkleBurst({
      count: overlay.count || 12,
      spread: overlay.spread || 140,
      duration: overlay.duration || 1000,
      x: overlay.x,
      y: overlay.y
    });
  }

  if (overlay.type === "flash") {
    createFlashOverlay(overlay.duration || 520);
  }
}

function updateOverlays() {
  const currentSong = getCurrentSong();
  const currentTime = audio.currentTime;

  if (!currentSong || !Array.isArray(currentSong.lyrics)) return;

  currentSong.lyrics.forEach((line, lineIndex) => {
    if (!Array.isArray(line.overlays)) return;

    line.overlays.forEach((overlay, overlayIndex) => {
      const overlayAt = typeof overlay.at === "number" ? overlay.at : line.start;
      const key = `${currentSongIndex}-${lineIndex}-${overlayIndex}`;

      if (!playedOverlayKeys.has(key) && currentTime >= overlayAt) {
        playedOverlayKeys.add(key);
        triggerOverlay(overlay);
      }
    });
  });
}

function getAutoOverlayPosition() {
  if (!lyricsEl) {
    return { x: 50, y: 50 };
  }

  const rect = lyricsEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const x = (centerX / window.innerWidth) * 100;
  const y = (centerY / window.innerHeight) * 100;

  return {
    x: x + (Math.random() - 0.5) * 8,
    y: y + (Math.random() - 0.5) * 5
  };
}

function createSparkleBurst(options = {}) {
  if (!fxLayerEl) return;

  const count = options.count || 12;
  const spread = options.spread || 140;
  const autoPos = getAutoOverlayPosition();
  const centerX = options.x ?? autoPos.x;
  const centerY = options.y ?? autoPos.y;

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

async function startPlayback() {
  if (startScreenEl) {
    startScreenEl.style.display = "none";
  }

  try {
    if (!spectrumReady) {
      setupSpectrum();
    }

    await resumeSpectrumContext();
    await audio.play();
  } catch (error) {
    console.error("再生エラー:", error);

    if (startScreenEl) {
      startScreenEl.style.display = "flex";
    }
  }
}

async function togglePlayPause() {
  if (audio.paused) {
    try {
      if (!spectrumReady) {
        setupSpectrum();
      }

      await resumeSpectrumContext();
      await audio.play();
    } catch (error) {
      console.error("再生エラー:", error);
    }
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
  if (!timelineEl) return;

  const rect = timelineEl.getBoundingClientRect();
  const positionX = event.clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, positionX / rect.width));
  const duration = audio.duration || 0;

  audio.currentTime = ratio * duration;
  playedOverlayKeys.clear();
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
  particleAnimationId = requestAnimationFrame(animateParticles);
}

function setupParticles() {
  if (!particleCanvas || !particleCtx) return;

  resizeParticleCanvas();
  initParticles();

  if (particleAnimationId) {
    cancelAnimationFrame(particleAnimationId);
  }

  animateParticles();
}

function resizeSpectrumCanvas() {
  if (!spectrumCanvas || !spectrumCtx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = spectrumCanvas.clientWidth || 760;
  const height = spectrumCanvas.clientHeight || 72;

  spectrumCanvas.width = Math.floor(width * dpr);
  spectrumCanvas.height = Math.floor(height * dpr);

  spectrumCtx.setTransform(1, 0, 0, 1, 0, 0);
  spectrumCtx.scale(dpr, dpr);
}

function setupSpectrum() {
  if (!audio || !spectrumCanvas || !spectrumCtx || spectrumReady) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext = new AudioContextClass();
  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 256;
  analyserNode.smoothingTimeConstant = 0.86;

  sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(analyserNode);
  analyserNode.connect(audioContext.destination);

  frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
  spectrumReady = true;

  resizeSpectrumCanvas();
  drawSpectrum();
}

async function resumeSpectrumContext() {
  if (!audioContext) return;
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
}

function drawBarsSpectrum(width, height) {
  const barCount = 48;
  const step = Math.max(1, Math.floor(frequencyData.length / barCount));
  const gap = 4;
  const barWidth = (width - gap * (barCount - 1)) / barCount;
  const baseY = height / 2;

  for (let i = 0; i < barCount; i += 1) {
    const value = frequencyData[i * step] / 255;
    const boosted = Math.pow(value, 1.4);
    const barHeight = Math.max(2, boosted * (height * 0.72));
    const x = i * (barWidth + gap);
    const y = baseY - barHeight / 2;

    spectrumCtx.fillStyle = `rgba(255, 255, 255, ${0.18 + boosted * 0.75})`;
    spectrumCtx.fillRect(x, y, barWidth, barHeight);
  }
}

function drawWaveSpectrum(width, height) {
  const pointCount = 64;
  const step = Math.max(1, Math.floor(frequencyData.length / pointCount));
  const centerY = height / 2;

  spectrumCtx.beginPath();
  spectrumCtx.lineWidth = 2;
  spectrumCtx.strokeStyle = "rgba(255, 255, 255, 0.88)";

  for (let i = 0; i < pointCount; i += 1) {
    const value = frequencyData[i * step] / 255;
    const boosted = Math.pow(value, 1.5);
    const x = (width / (pointCount - 1)) * i;
    const y = centerY - boosted * (height * 0.34);

    if (i === 0) {
      spectrumCtx.moveTo(x, y);
    } else {
      spectrumCtx.lineTo(x, y);
    }
  }

  spectrumCtx.stroke();

  spectrumCtx.beginPath();
  spectrumCtx.lineWidth = 1;
  spectrumCtx.strokeStyle = "rgba(180, 205, 255, 0.35)";

  for (let i = 0; i < pointCount; i += 1) {
    const value = frequencyData[i * step] / 255;
    const boosted = Math.pow(value, 1.5);
    const x = (width / (pointCount - 1)) * i;
    const y = centerY + boosted * (height * 0.34);

    if (i === 0) {
      spectrumCtx.moveTo(x, y);
    } else {
      spectrumCtx.lineTo(x, y);
    }
  }

  spectrumCtx.stroke();
}

function drawDotsSpectrum(width, height) {
  const dotCount = 42;
  const step = Math.max(1, Math.floor(frequencyData.length / dotCount));
  const baseY = height / 2;

  for (let i = 0; i < dotCount; i += 1) {
    const value = frequencyData[i * step] / 255;
    const boosted = Math.pow(value, 1.35);
    const x = (width / (dotCount - 1)) * i;
    const offset = boosted * (height * 0.28);
    const radius = 1.6 + boosted * 2.8;

    spectrumCtx.beginPath();
    spectrumCtx.fillStyle = `rgba(255, 255, 255, ${0.18 + boosted * 0.72})`;
    spectrumCtx.arc(x, baseY - offset, radius, 0, Math.PI * 2);
    spectrumCtx.fill();

    spectrumCtx.beginPath();
    spectrumCtx.fillStyle = `rgba(180, 205, 255, ${0.12 + boosted * 0.35})`;
    spectrumCtx.arc(x, baseY + offset, radius * 0.9, 0, Math.PI * 2);
    spectrumCtx.fill();
  }
}

function drawSpectrum() {
  if (
    !spectrumReady ||
    !spectrumCanvas ||
    !spectrumCtx ||
    !analyserNode ||
    !frequencyData
  ) {
    return;
  }

  const width = spectrumCanvas.clientWidth || 760;
  const height = spectrumCanvas.clientHeight || 72;

  analyserNode.getByteFrequencyData(frequencyData);
  spectrumCtx.clearRect(0, 0, width, height);

  if (spectrumMode === "bars") {
    drawBarsSpectrum(width, height);
  } else if (spectrumMode === "dots") {
    drawDotsSpectrum(width, height);
  } else {
    drawWaveSpectrum(width, height);
  }

  spectrumAnimationId = requestAnimationFrame(drawSpectrum);
}

function stopSpectrum() {
  if (spectrumAnimationId) {
    cancelAnimationFrame(spectrumAnimationId);
    spectrumAnimationId = null;
  }

  if (spectrumCtx && spectrumCanvas) {
    const width = spectrumCanvas.clientWidth || 760;
    const height = spectrumCanvas.clientHeight || 72;
    spectrumCtx.clearRect(0, 0, width, height);
  }
}

if (songSelectEl) {
  songSelectEl.addEventListener("change", (event) => {
    const nextIndex = Number(event.target.value);
    const shouldResume = !audio.paused;
    loadSong(nextIndex, shouldResume);
  });
}

if (spectrumModeSelectEl) {
  spectrumModeSelectEl.addEventListener("change", (event) => {
    spectrumMode = getSafeSpectrumMode(event.target.value);
  });
}

playPauseBtn?.addEventListener("click", togglePlayPause);
prevBtn?.addEventListener("click", playPrevSong);
nextBtn?.addEventListener("click", playNextSong);
timelineEl?.addEventListener("click", seekAudio);
startBtn?.addEventListener("click", startPlayback);

audio.addEventListener("timeupdate", () => {
  updateLyrics();
  updateProgress();
  updateOverlays();
});

audio.addEventListener("loadedmetadata", updateProgress);

audio.addEventListener("play", () => {
  if (playPauseBtn) {
    playPauseBtn.textContent = "⏸ Pause";
  }

  if (!spectrumReady) {
    setupSpectrum();
  }

  if (!spectrumAnimationId) {
    drawSpectrum();
  }
});

audio.addEventListener("pause", () => {
  if (playPauseBtn) {
    playPauseBtn.textContent = "▶ Play";
  }

  stopSpectrum();
});

audio.addEventListener("ended", () => {
  stopSpectrum();
  playNextSong();
});

window.addEventListener("resize", () => {
  resizeParticleCanvas();
  initParticles();
  resizeSpectrumCanvas();
});

renderSongOptions();
loadSong(0);
setupParticles();
