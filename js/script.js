let songs = [];
let currFolder;
let allAlbums = {};

let currentSong = new Audio();
let currentIndex = 0; // track which song is playing

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

// ✅ Build safe song path
function getSongPath(folder, filename) {
  return `./songs/${folder}/${encodeURIComponent(filename)}`;
}

const playMusic = (track, pause = false) => {
  currentSong.pause();
  currentSong.src = getSongPath(currFolder, track);
  currentSong.load();

  document.querySelector(".songinfo").innerHTML = decodeURIComponent(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
  document.querySelector(".circle").style.left = "0%";

  if (!pause) {
    currentSong.play().catch(err => console.error("❌ Play error", err));
    play.src = "assets/pause.svg";
  } else {
    play.src = "assets/play.svg";
  }

  currentIndex = songs.indexOf(track);
};

// Format song names into { artist, title }
function parseSong(filename) {
  const original = filename;
  let clean = filename.replace(/\.mp3$/i, "");
  clean = clean.replaceAll("_", " ");
  clean = clean.replace(/\[.*?\]|\(www.*?\)|mp3clan\.com| - Copy/gi, "");
  clean = clean.replace(/\s{2,}/g, " ").trim();

  const trackMatch = clean.match(/^\s*(\d+)([._-])\s*/);
  const track = trackMatch ? trackMatch[1] : null;

  let artist = "Unknown Artist";
  let title = clean;

  if (clean.includes(" - ")) {
    const [a, ...rest] = clean.split(" - ");
    artist = a.trim();
    title = rest.join(" - ").trim();
  } else {
    const m = clean.match(/^(.*)\s\(([^()]+)\)$/);
    if (m) {
      title = m[1].trim();
      artist = m[2].trim();
    }
  }

  return { filename: original, artist, title, track };
}

// Load albums.json
async function loadAlbums() {
  try {
    const res = await fetch("./songs.json");
    allAlbums = await res.json();
  } catch (err) {
    console.error("❌ Could not load songs.json", err);
    allAlbums = {};
  }
}

async function getSongs(folder) {
  currFolder = folder;
  if (!allAlbums[folder]) return [];

  songs = allAlbums[folder].songs;

  const songUL = document.querySelector(".songsList ul");
  songUL.innerHTML = "";

  for (const song of songs) {
    const { artist, title } = parseSong(song);
    songUL.innerHTML += `
      <li class="song-item" data-filename="${song}">
        <img class="invert icon" src="assets/music.svg" alt="">
        <div class="info">
          <div class="title">${title}</div>
          <div class="artist">${artist}</div>
        </div>
        <button class="playnow">
          <img class="invert" src="assets/play.svg" alt="">
        </button>
      </li>
    `;
  }

  return songs;
}

function displayAlbums() {
  const cardContainer = document.querySelector(".cardContainer");
  cardContainer.innerHTML = "";

  for (const folder in allAlbums) {
    const album = allAlbums[folder];
    const { title, Description } = album.info;

    cardContainer.innerHTML += `
      <article data-folder="${folder}" class="card" tabindex="0">
        <button class="play" aria-label="Play ${title}">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M8 5l11 7-11 7z" fill="#000" />
          </svg>
        </button>
        <img src="./songs/${folder}/img1.jpg" alt="Cover art for ${title}">
        <h2>${title}</h2>
        <p>${Description || ""}</p>
      </article>
    `;
  }

  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", async e => {
      const folder = e.currentTarget.dataset.folder;
      songs = (await getSongs(folder)) || [];
      if (songs.length > 0) {
        playMusic(songs[0], true); // load first song paused
      }
    });
  });
}

async function main() {
  await loadAlbums();
  await getSongs("CS"); // default album
  if (songs.length > 0) playMusic(songs[0], true);

  displayAlbums();

  currentSong.addEventListener("loadedmetadata", () => {
    document.querySelector(".songtime").innerHTML =
      `00:00 / ${formatTime(currentSong.duration)}`;
    document.querySelector(".circle").style.left = "0%";
  });

  // Delegate clicks for songs
  document.querySelector(".songsList").addEventListener("click", (ev) => {
    const li = ev.target.closest("li.song-item");
    if (!li) return;
    const filename = li.getAttribute("data-filename");
    playMusic(filename);
  });

  // Play / Pause button
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "assets/pause.svg";
    } else {
      currentSong.pause();
      play.src = "assets/play.svg";
    }
  });

  // Update seekbar + time
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML =
      `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Seekbar click
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    const pct = e.offsetX / e.target.getBoundingClientRect().width;
    document.querySelector(".circle").style.left = pct * 100 + "%";
    currentSong.currentTime = currentSong.duration * pct;
  });

  // Sidebar
  const hamburger = document.querySelector(".hamburger");
  const sidebar = document.querySelector(".left");
  const closeBtn = document.querySelector(".close");
  const MOBILE_BREAKPOINT = 1400;

  if (sidebar) {
    const clearInline = () => {
      sidebar.style.display = "";
      sidebar.classList.remove("active");
      document.body.style.overflow = "";
    };

    window.addEventListener("load", () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) clearInline();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        clearInline();
      }
    });
  }

  if (hamburger && sidebar) {
    hamburger.addEventListener("click", () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        sidebar.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    });
  }

  if (closeBtn && sidebar) {
    closeBtn.addEventListener("click", () => {
      sidebar.classList.remove("active");
      document.body.style.overflow = "";
      sidebar.style.display = "";
    });
  }

  // Previous song
  previous.addEventListener("click", () => {
    if (songs.length === 0) return;
    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    playMusic(songs[currentIndex]);
  });

  // Next song
  next.addEventListener("click", () => {
    if (songs.length === 0) return;
    currentIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[currentIndex]);
  });

  // Auto-play next when song ends
  currentSong.addEventListener("ended", () => {
    if (songs.length === 0) return;
    currentIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[currentIndex]);
  });

  // Volume
  const volume = document.querySelector(".volume");
  const volumeIcon = document.querySelector(".volume-icon");
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    volumeIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      volume.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!volume.contains(e.target) && volume.classList.contains("open")) {
        volume.classList.remove("open");
      }
    });
  }

  const volumeSlider = document.querySelector(".volume-slider");
  if (volumeSlider) {
    volumeSlider.addEventListener("input", (e) => {
      currentSong.volume = e.target.value;
    });
  }

  document.querySelector(".volume img").addEventListener("click", e => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document.querySelector(".range").value = 0;
    } else {
      currentSong.volume = 0.10;
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      document.querySelector(".range").value = 0.1;
    }
  });
}

main();
