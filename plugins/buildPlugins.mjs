import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import util from "util";
const promisifyExec = util.promisify(exec);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targets = path.join(__dirname, "target");
const PLUGIN_DIR = path.join(__dirname, `../core/public/plugins`);

const main = async () => {
	return Promise.all(
		fs.readdirSync(targets).map(async (entry) => {
			const entryFullPath = path.join(targets, entry);
			const isDir = fs.lstatSync(entryFullPath).isDirectory();
			if (!isDir || entry === "node_modules") return;
			console.log(`Building "${entry}" ...`);
			return promisifyExec("npx rollup -c ../../rollup.config.js", { cwd: entryFullPath })
				.then(({ stderr }) => {
					console.log(stderr);
					fs.rename(path.join(entryFullPath, "dist/bundle.js"), path.join(PLUGIN_DIR, `${entry}.js`), (e) => {
						if (e) {
							console.error(e);
							return;
						}
						console.log(`Moved "${entry}" to /public`);
					});
					return entry;
				})
				.catch((e) => console.error(e));
		}),
	)
		.then((x) => x.filter((x) => x))
		.then((x) =>
			fs.writeFile(
				path.join(PLUGIN_DIR, "pluginList.json"),
				JSON.stringify(x.map((name) => ({ name, url: `/plugins/${name}.js` }))),
				{ encoding: "utf-8" },
				(e) => {
					if (e) {
						console.error(e);
						return;
					}
					console.log(`Written to the "pluginList.json" file`);
				},
			),
		);
};

if (!fs.existsSync(PLUGIN_DIR))
	fs.mkdir(PLUGIN_DIR, (e) => {
		if (e) {
			console.error(e);
			return;
		}
		void main();
	});
else void main();
