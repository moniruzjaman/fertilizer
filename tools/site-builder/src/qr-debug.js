// Debug helper: renders a QR card PNG for a URL (used to validate the encoder).
import { writeOgPng } from "./og.js";
import { getConfig, qrTargetUrl } from "./config.js";
const url = process.argv[2] || "https://moniruzjaman.github.io/fertilizer/briefing";
const out = process.argv[3] || "/tmp/qr-test.png";
const config = getConfig();
await writeOgPng(out, { slug: "briefing", title: "QR Test Page", type: "rich-html" }, config, { qrUrl: url });
console.log("wrote", out, "for", url, "| payload bytes:", new TextEncoder().encode(url).length);
