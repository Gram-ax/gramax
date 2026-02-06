import { getConfig } from "@app/config/AppConfig";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import type Application from "@app/types/Application";
import type DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { joinTitles } from "@core-ui/getPageTitle";
import { createModulithService } from "@ext/serach/modulith/createModulithService";
import { getRawEnabledFeatures } from "@ext/toggleFeatures/features";
import crypto from "crypto-js";
import { dirname } from "path";
import type { HtmlData } from "./ArticleTypes";
import { logStep, logStepWithErrorSuppression } from "./cli/utils/logger";
import {
	type DirectoryInfoBasic,
	type FileInfoBasic,
	InitialDataKeys,
	type StaticConfig,
} from "./initialDataUtils/types";
import StaticContentCopier, { type CopyTemplatesFunction, type StaticFileProvider } from "./StaticContentCopier";
import StaticRenderer, { STATIC_WORKSPACE_PATH } from "./StaticRenderer";
import generateStaticSeo from "./StaticSeoGenerator";

const htmlTags = {
	base: "<!--base-tag-->",
	title: "<!--title-content-->",
	config: "<!--app-config-->",
	fs: "<!--data.js-->",
	data: "<!--app-data-->",
	body: "<!--app-body-->",
	styles: "<!--app-styles-->",
};

const CUSTOM_STYLE_FILENAME = "styles.css";
const CUSTOM_STYLE_LINK_ID = "custom-style-link";

const isBrowser = getExecutingEnvironment() === "browser";

interface StaticSiteGenerationOptions {
	baseUrl?: string;
	customStyles?: string;
	copyTemplate?: {
		copyWordTemplatesFunction?: CopyTemplatesFunction;
		copyPdfTemplatesFunction?: CopyTemplatesFunction;
	};
}

interface StaticSiteBuilderParams {
	fp: StaticFileProvider;
	app: Application;
	html: string;
	getCache: {
		fp?: () => { catceFileProvider: DiskFileProvider; articleStorageFileProvider: DiskFileProvider };
		tree: () => DirectoryInfoBasic | Promise<DirectoryInfoBasic>;
	};
}

class StaticSiteBuilder {
	constructor(private _params: StaticSiteBuilderParams) {}
	static readonly readonlyDir = "../bundle";

	private _generateHash(content: string): string {
		return crypto.MD5(content).toString().substring(0, 8);
	}

	async generate(catalog: Catalog, targetDir: Path, options: StaticSiteGenerationOptions) {
		const { copyTemplate, customStyles, baseUrl } = options;
		const catalogName = catalog.name;

		const directoryCopier = new StaticContentCopier(this._params.fp, this._params.app);
		const { zipFilename } = await logStepWithErrorSuppression("Copying directory", () =>
			directoryCopier.copyCatalog(catalog, targetDir),
		);
		const { directoryTree, wordTemplates, pdfTemplates } = await directoryCopier.copyWordTemplates(copyTemplate);

		const { rendered, searchDirectoryTree } = await logStepWithErrorSuppression(
			"Rendering HTML pages",
			async () => {
				return {
					rendered: await new StaticRenderer(this._params.app, { wordTemplates, pdfTemplates }).render(
						catalogName,
					),
					searchDirectoryTree: await this._createSearchIndexes(catalog, targetDir),
				};
			},
		);

		directoryTree.children.push(searchDirectoryTree);

		if (customStyles) {
			await this._params.fp.write(targetDir.join(new Path([catalogName, CUSTOM_STYLE_FILENAME])), customStyles);
			const customStyleLinkTag = this._createCustomStyleLinkTag(catalogName);
			this._params.html = this._params.html.replace(htmlTags.styles, `${customStyleLinkTag}\n${htmlTags.styles}`);
		}

		const dataJsContent = `window.${InitialDataKeys.DIRECTORY} = ${JSON.stringify(directoryTree)};`;

		const dataJsHash = this._generateHash(dataJsContent);
		const dataJsFilename = `data.${dataJsHash}.js`;

		await this._params.fp.write(targetDir.join(new Path([catalogName, dataJsFilename])), dataJsContent);

		await logStep("Writing rendered HTML files", () =>
			this._writingRenderedHtmlFiles(rendered, targetDir, catalogName, dataJsFilename, zipFilename),
		);

		if (baseUrl)
			await logStep("Creating sitemap.xml & robots.txt", () => this._writeSEOFiles(baseUrl, catalog, targetDir));
	}

	private _createSearchIndexes = async (catalog: Catalog, targetDir: Path) => {
		const modulithService = await createModulithService({
			basePath: targetDir,
			parser: this._params.app.parser,
			parserContextFactory: this._params.app.parserContextFactory,
			wm: this._params.app.wm,
			parseResources: false,
			fp: this._params.getCache.fp?.(),
		});

		await modulithService.updateCatalog(catalog.name, STATIC_WORKSPACE_PATH);

		const tree = await this._params.getCache.tree();
		return tree;
	};

	private _writingRenderedHtmlFiles = async (
		htmlDatas: HtmlData[],
		targetDir: Path,
		catalogName: string,
		dataJsFilename: string,
		zipFilename: string,
	) => {
		const config = getConfig();
		config.isProduction = true;
		config.isReadOnly = true;
		(config as StaticConfig).features = getRawEnabledFeatures();

		const templateHtml = this._params.html
			.replace(htmlTags.config, `window.${InitialDataKeys.CONFIG} = ${JSON.stringify(config) ?? "{}"}`)
			.replace(
				htmlTags.fs,
				`<script src="${catalogName}/${dataJsFilename}"></script>\n` +
					`<script>window.${InitialDataKeys.ZIP_FILENAME} = "${zipFilename}";</script>`,
			);

		const generateHtmlFile = async (htmlData: HtmlData) => {
			const is404Html = htmlData.initialData.data?.articlePageData?.articleProps?.errorCode === 404;
			const dataKey = `window.${InitialDataKeys.DATA} = `;
			const initialData = this._escapeDollars(JSON.stringify(htmlData.initialData) ?? "{}");

			const getLogicPath = () => {
				const get404Path = () => {
					if (isBrowser) return [htmlData.logicPath, "404.html"];
					return [htmlData.logicPath.substring(catalogName.length), "404.html"];
				};

				if (is404Html) return new Path(get404Path());
				return new Path(htmlData.logicPath).join(new Path("index.html"));
			};

			const logicPath = getLogicPath();

			const calculatedBasePath = is404Html ? "/" : logicPath.getRelativePath(new Path("."));
			const title = joinTitles(
				htmlData.initialData.data.articlePageData.articleProps.title,
				htmlData.initialData.data.catalogProps.title,
			);

			const html = templateHtml
				.replace(htmlTags.base, `<base href="${calculatedBasePath}">`)
				.replace(htmlTags.title, title)
				.replace(htmlTags.data, dataKey + initialData)
				.replace(htmlTags.body, htmlData.htmlContent.body ?? "")
				.replace(htmlTags.styles, htmlData.htmlContent.styles ?? "");

			const filePath = targetDir.join(logicPath);
			await this._params.fp.mkdir(new Path(dirname(filePath.value)));
			await this._params.fp.write(filePath, html);
		};

		if (!isBrowser)
			await this._params.fp.write(targetDir.join(new Path("index.html")), this._getRedirectHTML(catalogName));

		for (const htmlData of htmlDatas) await generateHtmlFile(htmlData);
	};

	private async _writeSEOFiles(baseUrl: string, catalog: Catalog, targetDir: Path) {
		const sanitizeBaseUrl = baseUrl.trim().replace(/\/+$/, "");
		const workspace = this._params.app.wm.current();
		const SEOFiles = await generateStaticSeo(sanitizeBaseUrl, catalog, workspace);
		await SEOFiles.mapAsync(async ({ content, name }) => {
			await this._params.fp.write(targetDir.join(new Path(isBrowser ? [catalog.name, name] : name)), content);
		});
	}

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
		<meta http-equiv="refresh" content="0;url=./${catalogName}">
	</head>
	</html>`;
	}

	private _createCustomStyleLinkTag(catalogName: string) {
		return `<link id="${CUSTOM_STYLE_LINK_ID}" rel="stylesheet" crossorigin href="${catalogName}/${CUSTOM_STYLE_FILENAME}">`;
	}

	static buildDirectoryTreeFromPaths(filePaths: string[]): DirectoryInfoBasic {
		const root: DirectoryInfoBasic = {
			name: "",
			type: "dir",
			children: [],
		};

		for (const filePath of filePaths) {
			const parts = filePath.split("/");
			let current = root;

			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				const isLast = i === parts.length - 1;

				if (isLast) {
					const file: FileInfoBasic = {
						name: part,
						type: "file",
					};
					current.children.push(file);
				} else {
					let dir = current.children.find(
						(child) => child.type === "dir" && child.name === part,
					) as DirectoryInfoBasic;

					if (!dir) {
						dir = {
							name: part,
							type: "dir",
							children: [],
						};
						current.children.push(dir);
					}
					current = dir;
				}
			}
		}

		return root;
	}
}

export default StaticSiteBuilder;
