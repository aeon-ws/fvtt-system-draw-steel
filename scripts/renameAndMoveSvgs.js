const fs = require("fs");
const path = require("path");

// Paths
const root = path.resolve(__dirname, "..");
const effectsFile = path.join(root, "src/data/effects/effects.ts");
const destDir = path.join(root, "icons/effects");

// Ensure destination exists
fs.mkdirSync(destDir, { recursive: true });

// Read effects.ts
let content = fs.readFileSync(effectsFile, "utf8");

// Match each object’s id and img path
const entryRe = /{\s*id:\s*"([^"]+)"[\s\S]*?img:\s*"([^"]+\.svg)"\s*}/g;
let m;
const entries = [];

while ((m = entryRe.exec(content)) !== null) {
  const [ , id, img ] = m;
  entries.push({ id, img: img.trim() });
}

// Process each entry
entries.forEach(({ id, img }) => {
  const src = path.join(root, img);
  console.log(`Processing: ${id} from ${src}`);
  const destName = `${id}.svg`;
  const dest = path.join(destDir, destName);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    // update path in content
    const oldPathEsc = img.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const newPath = `icons/effects/${destName}`;
    content = content.replace(new RegExp(oldPathEsc, "g"), newPath);
  } else {
    console.warn(`Not found: ${src}`);
  }
});

// Write updated effects.ts
fs.writeFileSync(effectsFile, content, "utf8");
console.log("SVG rename/move and effects.ts update complete.");
