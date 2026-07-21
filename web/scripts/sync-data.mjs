import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const dataDir = fileURLToPath(new URL("../../scraper/data/", import.meta.url));

mkdirSync(publicDir, { recursive: true });

for (const file of ["dataset.json", "rounds.json", "refresh-log.json"]) {
  copyFileSync(`${dataDir}${file}`, `${publicDir}${file}`);
  console.log(`Copied ${file} -> public/${file}`);
}
