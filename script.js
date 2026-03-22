const songs = [
  {
    title: "First Song",
    artist: "Your Artist",
    file: "songs/song1.mp3",
    lyrics: [
      { start: 0.5, end: 3.2, text: "最初のフレーズ" },
      { start: 3.4, end: 6.8, text: "やさしく浮かぶ歌詞" },
      { start: 7.2, end: 11.0, text: "少し遅れて消えていく" }
    ]
  },
  {
    title: "Second Song",
    artist: "Your Artist",
    file: "songs/song2.mp3",
    lyrics: [
      { start: 1.0, end: 4.0, text: "二曲目のはじまり" },
      { start: 4.2, end: 7.5, text: "雰囲気を変えてもいい" },
      { start: 8.0, end: 12.0, text: "サビだけ大きめに見せるのもあり" }
    ]
  },
  {
    title: "Third Song",
    artist: "Your Artist",
    file: "songs/song3.mp3",
    lyrics: [
      { start: 0.8, end: 3.6, text: "三曲目の歌詞" },
      { start: 4.0, end: 6.5, text: "短く切ると映える" },
      { start: 7.0, end: 10.5, text: "長文より一節ずつが強い" }
    ]
  }
];

const audio = document.getElementById("audio");
const lyricsEl = document.getElementById("lyrics");
const songTitle = document.getElementById("songTitle");
const songArtist = document.getElementById("songArtist");
const songSelect = document.getElementById("songSelect");
const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progress = document.getElementById("progress");
const timeline = document.getElementById("timeline");
const timeText = document.getElementById("timeText");
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");

let currentSongIndex = 0;
let currentLyricIndex = -1;

function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function renderSongOptions() {
  songSelect.innerHTML = "";

  songs.forEach((song, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${song.title} / ${song.artist}`;
    songSelect.appendChild(option);
  });
}

function loadSong(index, keepPlaying = false) {
  currentSongIndex = index;
  currentLyricIndex = -1;

  const song = songs[index];

  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  songSelect.value = index;

  audio.src = song.file;
  audio.load();

  lyricsEl.textContent = "";
  lyricsEl.classList.remove("show");
  progress.style.width = "0%";
  timeText.textContent = "0:00 / 0:00";

  if (keepPlaying) {
    audio.play().catch((error) => {
      console.error("再生エラー:", error);
    });
  }
}

function updateLyrics() {
  const currentTime = audio.currentTime;
  const song = songs[currentSongIndex];

  const newIndex = song.lyrics.findIndex((line) => {
    return currentTime >= line.start && currentTime < line.end;
  });

  if (newIndex !== currentLyricIndex) {
    currentLyricIndex = newIndex;
    lyricsEl.classList.remove("show");

    setTimeout(() => {
      if (currentLyricIndex === -1) {
        lyricsEl.textContent = "";
        return;
      }

      lyricsEl.textContent = song.lyrics[currentLyricIndex].text;
      lyricsEl.classList.add("show");
    }, 120);
  }
}

function updateProgress() {
  const current = audio.currentTime;
  const duration = audio.duration || 0;
  const percent = duration ? (current / duration) * 100 : 0;

  progress.style.width = `${percent}%`;
  timeText.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
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

songSelect.addEventListener("change", (event) => {
  const selectedIndex = Number(event.target.value);
  const shouldKeepPlaying = !audio.paused;
  loadSong(selectedIndex, shouldKeepPlaying);
});

playPauseBtn.addEventListener("click", togglePlayPause);
nextBtn.addEventListener("click", playNextSong);
prevBtn.addEventListener("click", playPrevSong);

startBtn.addEventListener("click", async () => {
  startScreen.style.display = "none";

  try {
    await audio.play();
  } catch (error) {
    console.error("再生エラー:", error);
    startScreen.style.display = "flex";
  }
});

audio.addEventListener("timeupdate", () => {
  updateLyrics();
  updateProgress();
});

audio.addEventListener("play", () => {
  playPauseBtn.textContent = "⏸ Pause";
});

audio.addEventListener("pause", () => {
  playPauseBtn.textContent = "▶ Play";
});

audio.addEventListener("ended", () => {
  playNextSong();
});

audio.addEventListener("loadedmetadata", () => {
  updateProgress();
});

timeline.addEventListener("click", (event) => {
  const rect = timeline.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const ratio = clickX / rect.width;
  audio.currentTime = ratio * (audio.duration || 0);
});

renderSongOptions();
loadSong(0);
