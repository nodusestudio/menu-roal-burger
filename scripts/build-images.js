/* Convierte PNG/JPG → WebP durante el build de Vercel */
const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const ROOT       = process.cwd();
const SKIP_FILES = new Set(['QR MENU DIGITAL_PRINT_20x20CM_300DPI.png']);
const SKIP_DIRS  = new Set(['node_modules', '.git', '.venv', 'tests', 'scripts', '.vercel']);

function findImages(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir)) {
        if (entry.startsWith('.')) continue;
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            if (!SKIP_DIRS.has(entry)) results.push(...findImages(full));
        } else if (/\.(png|jpg|jpeg)$/i.test(entry) && !SKIP_FILES.has(entry)) {
            results.push(full);
        }
    }
    return results;
}

async function main() {
    const images = findImages(ROOT);
    let converted = 0, skipped = 0, totalSaved = 0;

    for (const imgPath of images) {
        const webpPath = imgPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        const rel = path.relative(ROOT, imgPath);

        if (fs.existsSync(webpPath)) {
            const imgMtime  = fs.statSync(imgPath).mtimeMs;
            const webpMtime = fs.statSync(webpPath).mtimeMs;
            if (webpMtime >= imgMtime) { skipped++; continue; }
        }

        try {
            await sharp(imgPath).webp({ quality: 82 }).toFile(webpPath);
            const before = fs.statSync(imgPath).size;
            const after  = fs.statSync(webpPath).size;
            const saved  = before - after;
            totalSaved  += saved;
            converted++;
            console.log(`✓ ${rel} → .webp  (-${Math.round((1 - after / before) * 100)}%, ${Math.round(saved / 1024)}KB saved)`);
        } catch (e) {
            console.error(`✗ ${rel}: ${e.message}`);
        }
    }

    console.log(`\n${converted} convertidas, ${skipped} ya al día — ${(totalSaved / 1024 / 1024).toFixed(1)}MB ahorrados en total`);
}

main().catch(e => { console.error(e); process.exit(1); });
