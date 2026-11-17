const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw5ok5loQOKKzEalh4Sqtg5dswiUXEu4Zm992rPfzzo-90c7QCATIQi6gxsi4sJh5v7/exec";
const PARTY_DATE = new Date("2026-11-28T16:30:00+8:00").getTime();
const YOUTUBE_URL = "https://www.youtube.com/watch?v=vhVBWw6rId0&list=RDvhVBWw6rId0&start_radio=1";

// ==========================================
// 1. DOM ELEMENTS
// ==========================================
const coverScreen = document.getElementById("cover-screen");
const openInviteBtn = document.getElementById("open-invite-btn");
const mainContent = document.getElementById("main-content");
const confettiBtn = document.getElementById("confetti-btn");

const attendingSelect = document.getElementById("attending");
const guestCountsDiv = document.getElementById("guest-counts");
const rsvpForm = document.getElementById("rsvp-form");
const submitBtn = document.getElementById("submit-btn");
const formStatus = document.getElementById("form-status");
const wishesList = document.getElementById("wishes-list");
const musicToggleBtn = document.getElementById("music-toggle-btn");

// ==========================================
// 2. OPEN INVITATION & CONFETTI ENGINE
// ==========================================
openInviteBtn?.addEventListener("click", () => {
  coverScreen?.classList.add("fade-out");
  mainContent?.classList.remove("hidden");
  launchConfetti(100);
  startMusic();
  setTimeout(() => {
    coverScreen?.classList.add("hidden");
  }, 500);
});

confettiBtn?.addEventListener("click", () => launchConfetti(80));

function launchConfetti(count = 70) {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#f48fb1", "#f8bbd0", "#d86c8c", "#dfbe8a", "#ffffff"];
  const pieces = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height * 0.4,
    w: Math.random() * 10 + 6,
    h: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 4 + 3,
    rot: Math.random() * 360,
    vRot: (Math.random() - 0.5) * 10
  }));

  let animationId;
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vRot;
      if (p.y < canvas.height + 20) active = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (active) {
      animationId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationId);
    }
  }
  render();
}

// ==========================================
// 3. LIVE COUNTDOWN TIMER
// ==========================================
function updateCountdown() {
  const countdownEl = document.getElementById("countdown");
  if (!countdownEl) return;

  const now = Date.now();
  const diff = PARTY_DATE - now;

  if (diff <= 0) {
    countdownEl.innerHTML =
      "<p style='grid-column: span 4; font-weight: 700;'>🎉 It's Party Time Today! 🎉</p>";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ==========================================
// 4. RSVP FORM SUBMISSION & WISHES WALL
// ==========================================
attendingSelect?.addEventListener("change", () => {
  const isComing = attendingSelect.value.startsWith("Yes");
  if (guestCountsDiv) {
    guestCountsDiv.style.display = isComing ? "grid" : "none";
  }
  if (!isComing) {
    document.getElementById("adults").value = 0;
    document.getElementById("kids").value = 0;
  } else {
    document.getElementById("adults").value = 1;
    document.getElementById("kids").value = 1;
  }
});

rsvpForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending RSVP... ⏳";

  const notesInput = document.getElementById("notes");

  const payload = {
    name: document.getElementById("guest-name").value.trim(),
    attending: attendingSelect.value,
    adults: document.getElementById("adults").value,
    kids: document.getElementById("kids").value,
    notes: notesInput ? notesInput.value.trim() : "",
    wish: document.getElementById("wish").value.trim()
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === "success") {
      showStatus("Yay! Your RSVP has been saved. See you there! 🎉", "success");
      launchConfetti(90);

      if (payload.wish) {
        addWishToDOM(payload.name, payload.wish, true);
      }

      rsvpForm.reset();
      if (guestCountsDiv) guestCountsDiv.style.display = "grid";
    } else {
      throw new Error(result.message || "Something went wrong.");
    }
  } catch (err) {
    console.error(err);
    showStatus("Oops! Couldn't send your RSVP. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send RSVP 🎀";
  }
});

function showStatus(msg, type) {
  if (!formStatus) return;
  formStatus.textContent = msg;
  formStatus.className = `form-status ${type}`;
  formStatus.classList.remove("hidden");
}

function addWishToDOM(name, wish, prepend = false) {
  if (!wishesList) return;
  const emptyMsg = wishesList.querySelector(".loading-text");
  if (emptyMsg) emptyMsg.remove();

  const item = document.createElement("div");
  item.className = "wish-item";

  const author = document.createElement("strong");
  author.textContent = `🎀 ${name}`;

  const text = document.createElement("p");
  text.textContent = wish;

  item.appendChild(author);
  item.appendChild(text);

  if (prepend) {
    wishesList.prepend(item);
  } else {
    wishesList.appendChild(item);
  }
}

async function loadWishes() {
  if (!wishesList) return;
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();

    wishesList.innerHTML = "";
    if (data.wishes && data.wishes.length > 0) {
      data.wishes.forEach((w) => addWishToDOM(w.name, w.wish));
    } else {
      wishesList.innerHTML =
        '<p class="loading-text">No wishes yet. Be the first to send one! ✨</p>';
    }
  } catch (err) {
    console.error(err);
    wishesList.innerHTML =
      '<p class="loading-text">Could not load wishes right now.</p>';
  }
}

loadWishes();

// ==========================================
// 5. YOUTUBE BACKGROUND MUSIC (SAFE LOADER)
// ==========================================
let ytPlayer = null;
let isPlayerReady = false;
let isMusicPlaying = false;
let wantsToPlay = false;

function extractYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

window.onYouTubeIframeAPIReady = function () {
  const videoId = extractYouTubeId(YOUTUBE_URL);
  if (!videoId) {
    if (musicToggleBtn) musicToggleBtn.textContent = "🔇 Invalid YouTube URL";
    return;
  }

  const playerVars = {
    autoplay: 0,
    controls: 0,
    loop: 1,
    playlist: videoId,
    playsinline: 1
  };

  if (window.location.protocol.startsWith("http")) {
    playerVars.origin = window.location.origin;
  }

  ytPlayer = new YT.Player("yt-player", {
    height: "200",
    width: "200",
    videoId: videoId,
    playerVars: playerVars,
    events: {
      onReady: (event) => {
        isPlayerReady = true;
        event.target.setVolume(60);
        if (wantsToPlay) {
          startMusic();
        }
      },
      onError: (e) => {
        console.warn("YouTube Error Code:", e.data);
        if (musicToggleBtn) {
          musicToggleBtn.textContent =
            e.data === 101 || e.data === 150
              ? "🔇 Song Blocks Embed"
              : "🔇 Music Unavailable";
        }
      }
    }
  });
};

// Dynamically load YouTube API AFTER onYouTubeIframeAPIReady is defined
(function loadYouTubeAPI() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

function startMusic() {
  wantsToPlay = true;
  musicToggleBtn?.classList.remove("hidden");

  if (isPlayerReady && ytPlayer) {
    ytPlayer.playVideo();
    isMusicPlaying = true;
    if (musicToggleBtn) musicToggleBtn.textContent = "🎵 Music: On";
  }
}

musicToggleBtn?.addEventListener("click", () => {
  if (!isPlayerReady || !ytPlayer) return;

  if (isMusicPlaying) {
    ytPlayer.pauseVideo();
    isMusicPlaying = false;
    musicToggleBtn.textContent = "🔇 Music: Off";
  } else {
    ytPlayer.playVideo();
    isMusicPlaying = true;
    musicToggleBtn.textContent = "🎵 Music: On";
  }
});
