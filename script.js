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

const EFFECT_CLASSES = [
  "effect-fade",
  "effect-float",
  "effect-blur",
  "effect-pop",
  "effect-chorus",
  "effect-drift"
];

const DEFAULT_EFFECT = "fade";

let currentSongIndex = 0;
let currentLyricIndex = -1;
let lyricChangeTimer = null;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

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

function resetLyrics() {
  clearTimeout(lyricChangeTimer);
  currentLyricIndex = -1;
  clearEffectClasses();
  lyricsEl.classList.remove("show", "hide");
  lyricsEl.textContent = "";
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

  return currentSong.lyrics.findIndex((line) => {
    return currentTime >= line.start && currentTime < line.end;
  });
}

function getSafeEffectName(effectName) {
  if (typeof effectName !== "string") {
    return DEFAULT_EFFECT;
  }

  const normalized = effectName.trim().toLowerCase();
  const className = `effect-${normalized}`;

  return EFFECT_CLASSES.includes(className) ? normalized : DEFAULT_EFFECT;
}

function showLyric(line) {
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

  if (newLyricIndex === currentLyricIndex) {
    return;
  }

  currentLyricIndex = newLyricIndex;

  if (currentLyricIndex === -1) {
    clearLyric();
    return;
  }

  const currentSong = songs[currentSongIndex];
  const currentLyric = currentSong.lyrics[currentLyricIndex];
  showLyric(currentLyric);
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

renderSongOptions();
loadSong(0);

const particleCanvas = document.getElementById("particleCanvas");
const particleCtx = particleCanvas.getContext("2d");

const PARTICLE_COUNT = 42;
const PARTICLE_COLOR = "rgba(255, 255, 255, 0.22)";
const PARTICLE_LINK_COLOR = "rgba(180, 205, 255, 0.08)";

let particles = [];
let animationFrameId = null;

function resizeParticleCanvas() {
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
  const width = window.innerWidth;
  const height = window.innerHeight;

  particleCtx.clearRect(0, 0, width, height);

  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i];

    for (let j = i + 1; j < particles.length; j += 1) {
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 120) {
        const alpha = (1 - dist / 120) * 0.22;
        particleCtx.strokeStyle = `rgba(180, 205, 255, ${alpha * 0.35})`;
        particleCtx.lineWidth = 1;
        particleCtx.beginPath();
        particleCtx.moveTo(a.x, a.y);
        particleCtx.lineTo(b.x, b.y);
        particleCtx.stroke();
      }
    }
  }

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

window.addEventListener("resize", () => {
  resizeParticleCanvas();
  initParticles();
});

setupParticles();
