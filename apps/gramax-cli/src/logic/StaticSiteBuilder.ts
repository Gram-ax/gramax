import { getConfig } from "@app/config/AppConfig";

import { getExecutingEnvironment } from "@app/resolveModule/env";
import { DirectoryInfoBasic } from "@app/resolveModule/fscall/static";
import Application from "@app/types/Application";
import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import StaticRenderer from "./StaticRenderer";
import { logStepWithErrorSuppression, logStep } from "./cli/utils/logger";
import { RenderedHtml, HtmlData } from "./ArticleTypes";
import { STORAGE_DIR_NAME } from "@app/config/const";
import { dirname } from "path";

export type StaticFileProvider = Pick<FileProvider, "write" | "copy" | "mkdir">;

export enum InitialDataKeys {
	DATA = "__INITIAL_DATA__",
	CONFIG = "__INITIAL_CONFIG__",
	DIRECTORY = "__DIRECTORY__",
}

const htmlTags = {
	config: "<!--app-config-->",
	fs: "<!--data.js-->",
	data: "<!--app-data-->",
	body: "<app-body/>",
	styles: "<app-styles/>",
};

const isBrowser = getExecutingEnvironment() === "browser";

class StaticSiteBuilder {
	constructor(private _fp: StaticFileProvider, private _app: Application, private _html: string) {}
	static readonly readonlyDir = "bundle";

	async generate(catalog: Catalog, targetDir: Path) {
		const catalogName = catalog.name;

		const directoryTree = await logStepWithErrorSuppression("Copying directory", () =>
			this._copyDir(catalog, targetDir),
		);
		const searchDirectoryTree = await this._createSearchIndexes(catalog, targetDir);

		directoryTree.children.push(searchDirectoryTree);

		const rendered = await logStepWithErrorSuppression("Rendering HTML pages", async () =>
			new StaticRenderer(this._app).render(catalogName),
		);

		await this._fp.write(
			targetDir.join(new Path([catalogName, "data.js"])),
			`window.${InitialDataKeys.DIRECTORY} = ${JSON.stringify(directoryTree)}`,
		);

		await logStep("Writing rendered HTML files", () =>
			this._writingRenderedHtmlFiles(rendered, targetDir, catalogName),
		);
	}

	private async _copyDir(catalog: Catalog, targetDir: Path) {
		const wmPath = this._app.wm.current().path();

		const directoryTree: DirectoryInfoBasic = { type: "dir", name: "docs", children: [] };

		const addToDirectoryTree = (path: string) => {
			const parts = path.split("/");
			let currentDir = directoryTree;
			for (let i = 0; i < parts.length - 1; i++) {
				let nextDir = currentDir.children.find(
					(child): child is DirectoryInfoBasic => child.type === "dir" && child.name === parts[i],
				);
				if (!nextDir) {
					nextDir = { type: "dir", name: parts[i], children: [] };
					currentDir.children.push(nextDir);
				}
				currentDir = nextDir;
			}
			currentDir.children.push({ type: "file", name: parts[parts.length - 1] });
		};

		const copyFile = async (from: Path, to: Path) => {
			const absoluteFrom = new Path(wmPath).join(from);
			const targetPath = targetDir.join(to);
			await this._fp.copy(absoluteFrom, targetPath);
			addToDirectoryTree(to.value);
		};

		const copyLogoFile = async (logoProp: string) => {
			if (!catalog.props[logoProp]) return;
			await copyFile(
				catalog.getRootCategoryDirectoryPath().join(new Path(catalog.props[logoProp])),
				new Path(catalog.name).join(new Path(catalog.props[logoProp])),
			);
		};

		const ctx = await this._app.contextFactory.fromBrowser("", null);
		const sp = this._app.sitePresenterFactory.fromContext(ctx);
		await sp.parseAllItems(catalog);

		const items = catalog.getContentItems();

		for (const i of items) {
			if (!(await i.parsedContent.read())) throw new Error("Failed to parse one of the Markdown files");
		}

		const folderPath = catalog.getRootCategory().folderPath.value;
		const fp = this._app.wm.current().getFileProvider();

		const docroot = catalog.getRootCategoryRef().path;
		if (await fp.exists(docroot)) {
			await copyFile(docroot, new Path(catalog.name).join(new Path(docroot.value.replace(folderPath, ""))));
			await copyLogoFile("logo");
			await copyLogoFile("logo_dark");
		}

		await Promise.all(
			catalog.getItems().map(async (item) => {
				const absoluteArticlePath = item.ref.path;
				const targetArticlePath = new Path(catalog.name).join(
					new Path(absoluteArticlePath.value.replace(folderPath, "")),
				);
				await copyFile(absoluteArticlePath, targetArticlePath);
			}),
		);

		await Promise.all(
			catalog.snippetProvider.getSnippetsPaths().map(async (path) => {
				const targetPath = new Path(catalog.name).join(new Path(path.value.replace(folderPath, "")));
				await copyFile(path, targetPath);
			}),
		);

		await Promise.all(
			catalog.iconProvider.getIconsPaths().map(async (path) => {
				const targetPath = new Path(catalog.name).join(new Path(path.value.replace(folderPath, "")));
				await copyFile(path, targetPath);
			}),
		);

		for (const item of items) {
			const resources = await item.parsedContent.read();
			const rm = resources.resourceManager;
			await Promise.all(
				rm.resources.map(async (r) => {
					const absolutePath = rm.getAbsolutePath(r);
					const targetPath = new Path(catalog.name).join(
						new Path(absolutePath.value.replace(folderPath, "")),
					);
					await copyFile(absolutePath, targetPath);
				}),
			);
		}
		return directoryTree;
	}

	private _createSearchIndexes = async (catalog: Catalog, targetDir: Path) => {
		const catalogFolderPath = catalog.getRootCategory().folderPath.value;
		const catalogBasePath = catalog.basePath.value;
		const indexData = await this._app.indexDataProvider.getIndexData(catalog.name);

		const processedIndexData = indexData.map((item) => ({
			...item,
			path: item.path.replace(catalogFolderPath, catalogBasePath),
		}));
		await this._fp.write(
			targetDir.join(new Path([STORAGE_DIR_NAME, catalog.name])),
			JSON.stringify(processedIndexData),
		);
		return {
			type: "dir",
			name: STORAGE_DIR_NAME,
			children: [
				{
					type: "file",
					name: catalog.name,
				},
			],
		} as DirectoryInfoBasic;
	};

	private _writingRenderedHtmlFiles = async (rendered: RenderedHtml, targetDir: Path, catalogName: string) => {
		const config = getConfig();
		config.isReadOnly = true;

		const templateHtml = this._html
			.replace(htmlTags.config, `window.${InitialDataKeys.CONFIG} = ` + (JSON.stringify(config) ?? "{}"))
			.replace(htmlTags.fs, `<script src="/${catalogName}/data.js"></script>`);

		const generateHtmlFile = async (htmlData: HtmlData, logicPath: Path) => {
			const dataKey = `window.${InitialDataKeys.DATA} = `;
			const initialData = this._escapeDollars(JSON.stringify(htmlData.initialData) ?? "{}");

			const html = templateHtml
				.replace(htmlTags.data, dataKey + initialData)
				.replace(htmlTags.body, htmlData.htmlContent.body ?? "")
				.replace(htmlTags.styles, htmlData.htmlContent.styles ?? "");

			const filePath = targetDir.join(logicPath);
			await this._fp.mkdir(new Path(dirname(filePath.value)));
			await this._fp.write(filePath, html);
		};

		if (!isBrowser)
			await this._fp.write(targetDir.join(new Path("index.html")), this._getRedirectHTML(catalogName));

		await generateHtmlFile(rendered.article404Html, new Path(isBrowser ? [catalogName, "404.html"] : "404.html"));
		await generateHtmlFile(rendered.defaultHtml, new Path(catalogName).join(new Path("index.html")));

		for (const htmlData of rendered.htmlData) {
			await generateHtmlFile(htmlData, new Path(htmlData.logicPath).join(new Path("index.html")));
		}
	};

	private _escapeDollars(str: string) {
		return str.replaceAll("$$", "$$$$$$$$");
	}

	private _getRedirectHTML(catalogName: string) {
		return `<!doctype html>
	<html lang="ru">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>${catalogName}</title>
		<meta http-equiv="refresh" content="0;url=/${catalogName}">
	</head>
	</html>`;
	}
}

export default StaticSiteBuilder;
