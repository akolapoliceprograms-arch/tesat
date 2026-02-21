// ══════════════════════════════════════════════════════════
// Certificate Download Dashboard – Script
// ══════════════════════════════════════════════════════════

// ── Particle Background ────────────────────────────────────
const particleCanvas = document.getElementById("particleCanvas");
const pCtx = particleCanvas.getContext("2d");
let particles = [];

function resizeParticleCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeParticleCanvas);
resizeParticleCanvas();

function initParticles() {
    particles = [];
    const count = Math.min(70, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            r: Math.random() * 1.5 + 0.5,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            alpha: Math.random() * 0.35 + 0.1,
        });
    }
}
initParticles();

function animateParticles() {
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = particleCanvas.width;
        if (p.x > particleCanvas.width) p.x = 0;
        if (p.y < 0) p.y = particleCanvas.height;
        if (p.y > particleCanvas.height) p.y = 0;

        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        pCtx.fill();
    });

    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) {
                pCtx.beginPath();
                pCtx.moveTo(particles[i].x, particles[i].y);
                pCtx.lineTo(particles[j].x, particles[j].y);
                pCtx.strokeStyle = `rgba(16,185,129,${0.06 * (1 - dist / 110)})`;
                pCtx.lineWidth = 0.5;
                pCtx.stroke();
            }
        }
    }

    requestAnimationFrame(animateParticles);
}
animateParticles();

// ── Confetti System ────────────────────────────────────────
const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");
let confettiPieces = [];
let confettiRunning = false;

function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfetti);
resizeConfetti();

const CONFETTI_COLORS = [
    "#10b981", "#3b82f6", "#a855f7", "#f59e0b",
    "#ec4899", "#06b6d4", "#f43f5e", "#84cc16",
    "#ffffff", "#fbbf24",
];

function createConfetti(count) {
    for (let i = 0; i < count; i++) {
        confettiPieces.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * -confettiCanvas.height * 0.5,
            w: Math.random() * 10 + 5,
            h: Math.random() * 6 + 3,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            vy: Math.random() * 3 + 2,
            vx: Math.random() * 4 - 2,
            rotation: Math.random() * 360,
            rotSpeed: Math.random() * 8 - 4,
            opacity: 1,
        });
    }
}

function animateConfetti() {
    if (!confettiRunning) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiPieces.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        p.rotation += p.rotSpeed;
        p.vy += 0.04;
        p.opacity -= 0.002;

        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.globalAlpha = Math.max(p.opacity, 0);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        confettiCtx.restore();
    });

    confettiPieces = confettiPieces.filter(
        (p) => p.y < confettiCanvas.height + 40 && p.opacity > 0
    );

    if (confettiPieces.length > 0) {
        requestAnimationFrame(animateConfetti);
    } else {
        confettiRunning = false;
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
}

function launchConfetti() {
    confettiRunning = true;
    createConfetti(120);
    setTimeout(() => createConfetti(60), 300);
    animateConfetti();
}

// ── Success Toast ──────────────────────────────────────────
function showSuccessToast() {
    const toast = document.getElementById("successToast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

// ── Live Counter (from server) ─────────────────────────────
const liveCountEl = document.getElementById("liveCount");

async function fetchLiveCount() {
    try {
        const res = await fetch("/api/count");
        const data = await res.json();
        liveCountEl.textContent = data.count;
    } catch {
        // Fallback: use localStorage if server is not running
        liveCountEl.textContent = localStorage.getItem("certDownloadCount") || "0";
    }
}

function popCount() {
    liveCountEl.classList.add("pop");
    setTimeout(() => liveCountEl.classList.remove("pop"), 300);
}

// Load initial count
fetchLiveCount();
// Auto-refresh every 10 seconds
setInterval(fetchLiveCount, 10000);

// ── Certificate Download ───────────────────────────────────
const certCanvas = document.getElementById("certificateCanvas");
const ctx = certCanvas.getContext("2d");
const bgImage = new Image();
bgImage.src = "Raising Day.jpeg";
bgImage.crossOrigin = "anonymous";

document.getElementById("downloadBtn").addEventListener("click", () => {
    const name = document.getElementById("username").value.trim();

    if (!name) {
        const wrapper = document.querySelector(".input-wrapper");
        wrapper.style.animation = "none";
        wrapper.offsetHeight;
        wrapper.style.animation = "shake 0.4s ease";
        alert("Please enter your name before downloading!");
        return;
    }

    if (bgImage.complete) {
        drawAndDownload(name);
    } else {
        bgImage.onload = function () {
            drawAndDownload(name);
        };
    }
});

async function drawAndDownload(name) {
    ctx.clearRect(0, 0, certCanvas.width, certCanvas.height);
    ctx.drawImage(bgImage, 0, 0, certCanvas.width, certCanvas.height);

    const formattedName = name
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

    ctx.font = "bold 40px Serif";
    ctx.fillStyle = "#8d0000";
    ctx.textAlign = "center";
    ctx.fillText(formattedName, certCanvas.width / 1.9, 300);

    const link = document.createElement("a");
    link.download = `${formattedName}_Certificate.png`;
    link.href = certCanvas.toDataURL("image/png");
    link.click();

    // Celebrate
    launchConfetti();
    showSuccessToast();

    // Log download to server
    try {
        const res = await fetch("/api/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: formattedName }),
        });
        const data = await res.json();
        if (data.count) {
            liveCountEl.textContent = data.count;
            popCount();
        }
    } catch {
        // Fallback: use localStorage if server is unavailable
        const count = parseInt(localStorage.getItem("certDownloadCount") || "0", 10) + 1;
        localStorage.setItem("certDownloadCount", count);
        liveCountEl.textContent = count;
        popCount();
    }

    // Refresh after celebration
    setTimeout(() => location.reload(), 3500);
}
