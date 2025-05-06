import { existsSync, mkdirSync, writeFile, writeFileSync } from "fs";
import { join } from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import { Readable } from "stream";
import { InternalPath } from "../utils";

const pipelineAsync = promisify(pipeline);

class FileProvider {
	static exist(filePath: string) {
		return existsSync(filePath);
	}

	static createDir(folderPath: string, isRelativePath = true) {
		const path = isRelativePath ? join(InternalPath.pathToContent, folderPath) : folderPath;

		if (!existsSync(path)) {
			mkdirSync(path, { recursive: true });
		}
	}

	static async writeFile(stream: ReadableStream, slug: string, fileName: string) {
		const path = join(InternalPath.pathToContent, slug);
		const folderIsExist = FileProvider.exist(path);

		if (!folderIsExist) throw new Error(`Folder is not exist, path: ${slug}; file-name: ${fileName}`);

		const filePath = join(path, fileName);
		const writeStream = createWriteStream(filePath);

		const nodeReadable = Readable.fromWeb(stream as any);
		await pipelineAsync(nodeReadable, writeStream);
	}

	static writeFileAsync(content: string, filePath: string, fileName: string) {
		const path = join(InternalPath.pathToContent, filePath);

		try {
			writeFile(path, content, "utf8", () => {});
		} catch (err) {
			console.error("Write error:", err);
		}
	}

	static writeMarkdown(filePath: string, content: string) {
		const path = join(InternalPath.pathToContent, filePath);

		writeFileSync(path, content, "utf8");
	}

	static getIndexArticlePaths(filePath: string) {
		const folderPath = filePath;
		const articlePath = join(filePath, "_index.md");

		return { folderPath, articlePath };
	}

	static getArticlePath(filePath: string) {
		const folderPath = filePath !== "" ? join(filePath, "../") : "";
		const articlePath = filePath + ".md";

		return { folderPath, articlePath };
	}

	static writeYaml(filePath: string, yamlContent: string) {
		const path = join(InternalPath.pathToContent, filePath);

		writeFileSync(path, yamlContent, "utf8");
	}
}

export default FileProvider;
