import fs from "fs";
import { join, resolve } from "path";
import TJS from "typescript-json-schema";
import parseMarkdown from "./logic/parseMarkdown.mjs";

const settings = {
	required: true,
	ref: false,
	validationKeywords: ["private", "readOnly", "see"],
};

await initSchemes("./core/");

async function initSchemes(basePath, contextOutPath = "/") {
	const types = findInterfaces(basePath);
	const typeFilesPath = types.map((type) => type.path);
	const program = TJS.programFromConfig("tsconfig.json", typeFilesPath);
	const schemaNames = types.map((type) => type.schemaName);

	for (const schemaName of schemaNames) {
		const jsonSchema = TJS.generateSchema(program, schemaName, settings);
		await parse(jsonSchema);
		const data = JSON.stringify(jsonSchema, null, 4);
		const path =
			join(directoryPath(types.find((type) => type.schemaName === schemaName).path), contextOutPath) +
			`/${schemaName}.schema.json`;
		if (fs.existsSync(path)) fs.writeFileSync(path, data, "utf-8");
		else {
			fs.mkdirSync(directoryPath(path), { recursive: true });
			fs.writeFileSync(path, data, { encoding: "utf-8", flag: "wx" });
		}
	}
}

async function parse(object, deep = 0) {
	if (!object || typeof object !== "object") return;

	if ("description" in object && typeof object.description === "string")
		object.description = await parseMarkdown(object.description);

	if ("title" in object && typeof object.title === "string") object.title = await parseMarkdown(object.title);

	if (deep > 100) throw new Error("Commands structure are invalid");
	for (const value of Object.values(object)) await parse(value, ++deep);
}

function directoryPath(path) {
	return path.match(/(.+)[/\\]/)?.[1] ?? "";
}

function findInterfaces(path) {
	const interfacePaths = [];
	const files = fs.readdirSync(path);
	files.forEach((file) => {
		const filePath = join(path, file);
		if (fs.statSync(filePath).isDirectory()) {
			interfacePaths.push(...findInterfaces(filePath));
		} else {
			const regex = /(.*)\.schema\.ts$/.exec(file);
			if (regex) interfacePaths.push({ path: resolve(filePath), schemaName: regex[1] });
		}
	});
	return interfacePaths;
}
