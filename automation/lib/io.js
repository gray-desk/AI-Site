const fs = require('fs');

const readJson = (filePath, fallback) => {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

module.exports = {
  readJson,
  writeJson,
  ensureDir,
};
