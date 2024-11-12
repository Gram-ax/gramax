import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the index.html file
const indexPath = path.join(__dirname, "dist/index.html");
let indexContent = fs.readFileSync(indexPath, "utf8");

// Replace the comment with the script tag
indexContent = indexContent.replace("<!-- import env script -->", '<script src="/env.js"></script>');

// Write the modified content back to index.html
fs.writeFileSync(indexPath, indexContent, "utf8");

console.log("Successfully updated index.html with env.js script tag.");
