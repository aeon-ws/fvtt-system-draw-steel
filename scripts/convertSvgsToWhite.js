const fs = require("fs");
const path = require("path");

// folder to process
const svgDir = path.join(__dirname, "../icons/svg/statuses/temp");

fs.readdirSync(svgDir)
  .filter(f => f.endsWith(".svg"))
  .forEach(file => {
    const p = path.join(svgDir, file);
    let content = fs.readFileSync(p, "utf8");
    // replace fill="black", fill="#000" or fill="#000000" with white
    content = content
      .replace(/fill="(#000000|#000|black)"/gi, 'fill="white"')
      // if no fill attribute on <path> you can add one (optional)
      //.replace(/<path([^>]*?)>/g, '<path$1 fill="white">')
      ;
    fs.writeFileSync(p, content, "utf8");
    console.log(`Updated ${file}`);
  });
