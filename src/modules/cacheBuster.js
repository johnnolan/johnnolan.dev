const crypto = require("crypto");
const fs = require("fs");

function getHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash("md5").update(fileBuffer).digest("hex").slice(0, 8);
  } catch (err) {
    console.warn(`⚠️ Cache busting failed for ${filePath}:`, err.message);
    return "dev";
  }
}

module.exports = { getHash };
