const express = require("express");
const fs = require("fs");
const path = require("path");
const UAParser = require("ua-parser-js");

const app = express();
const PORT = 3000;

// ── Admin key – change this to your own secret! ──────────────
const ADMIN_KEY = "akola@admin2025";

// ── Data file ────────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, "downloads.json");

function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(__dirname));

// ── API: Get total count (public) ────────────────────────────
app.get("/api/count", (req, res) => {
    const data = readData();
    res.json({ count: data.length });
});

// ── API: Log a download (public) ─────────────────────────────
app.post("/api/download", (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Name is required" });
    }

    // Get IP
    const ip =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        "Unknown";

    // Parse User-Agent
    const ua = new UAParser(req.headers["user-agent"]);
    const browser = ua.getBrowser();
    const os = ua.getOS();
    const device = ua.getDevice();

    const entry = {
        id: Date.now(),
        name: name.trim(),
        ip: ip,
        browser: `${browser.name || "Unknown"} ${browser.version || ""}`.trim(),
        os: `${os.name || "Unknown"} ${os.version || ""}`.trim(),
        device: device.type
            ? `${device.vendor || ""} ${device.model || ""} (${device.type})`.trim()
            : "Desktop",
        userAgent: req.headers["user-agent"] || "Unknown",
        timestamp: new Date().toISOString(),
    };

    const data = readData();
    data.push(entry);
    writeData(data);

    console.log(`✅ Certificate #${data.length} downloaded by "${entry.name}" from ${entry.ip}`);

    res.json({ success: true, count: data.length });
});

// ── API: Get all downloads (admin only) ──────────────────────
app.get("/api/downloads", (req, res) => {
    const key = req.query.key;
    if (key !== ADMIN_KEY) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    const data = readData();
    res.json({ count: data.length, downloads: data.reverse() });
});

// ── API: Clear all downloads (admin only) ────────────────────
app.delete("/api/downloads", (req, res) => {
    const key = req.query.key;
    if (key !== ADMIN_KEY) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    writeData([]);
    console.log("🗑️  All download logs cleared by admin");
    res.json({ success: true });
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log("");
    console.log("══════════════════════════════════════════════");
    console.log("  🚀 Certificate Dashboard Server Running");
    console.log(`  📄 Main Page:  http://localhost:${PORT}`);
    console.log(`  🔐 Admin:      http://localhost:${PORT}/admin.html`);
    console.log(`  🔑 Admin Key:  ${ADMIN_KEY}`);
    console.log("══════════════════════════════════════════════");
    console.log("");
});
