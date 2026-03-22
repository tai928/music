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

function resetLyrics() {
  clearTimeout(lyricChangeTimer);
  currentLyricIndex = -1;
  lyricsEl.classList.remove("show");
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

function updateLyrics() {
  const newLyricIndex = getCurrentLyricIndex(audio.currentTime);

  if (newLyricIndex === currentLyricIndex) {
    return;
  }

  currentLyricIndex = newLyricIndex;
  clearTimeout(lyricChangeTimer);

  lyricsEl.classList.remove("show");

  lyricChangeTimer = setTimeout(() => {
    if (currentLyricIndex === -1) {
      lyricsEl.textContent = "";
      return;
    }

    const currentSong = songs[currentSongIndex];
    const currentLyric = currentSong.lyrics[currentLyricIndex];

    lyricsEl.textContent = currentLyric.text;
    lyricsEl.classList.add("show");
  }, 120);
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
