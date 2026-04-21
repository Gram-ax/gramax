import { getConfig } from "@app/config/AppConfig";
import resolveBackendModule from "@app/resolveModule/backend";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import type Application from "@app/types/Application";
import type DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { joinTitles } from "@core-ui/getPageTitle";
import { createModulithFileProviders, createModulithService } from "@ext/serach/modulith/createModulithService";
import { getRawEnabledFeatures } from "@ext/toggleFeatures/features";
import assert from "assert";
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
	singleCatalog?: boolean;
}

interface StaticSiteBuilderParams {
	fp: StaticFileProvider;
	app: Application;
	html: string;
	getCache: {
		fp?: () => { cacheFileProvider: DiskFileProvider; articleStorageFileProvider: DiskFileProvider };
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
		const { copyTemplate, customStyles, baseUrl, singleCatalog = false } = options;
		const catalogName = catalog.name;
		const pathPrefix = singleCatalog ? "" : catalogName;

		const directoryCopier = new StaticContentCopier(this._params.fp, this._params.app);
		const { zipFilename } = await logStepWithErrorSuppression("Copying directory", () =>
			directoryCopier.copyCatalog(catalog, targetDir, singleCatalog),
		);
		const { directoryTree, wordTemplates, pdfTemplates } = await directoryCopier.copyWordTemplates(copyTemplate);

		const { rendered, searchDirectoryTree } = await logStepWithErrorSuppression(
			"Rendering HTML pages",
			async () => {
				return {
					rendered: await new StaticRenderer(this._params.app, {
						wordTemplates,
						pdfTemplates,
						singleCatalog,
					}).render(catalogName),
					searchDirectoryTree: await this._createSearchIndexes(catalog, targetDir, pathPrefix),
				};
			},
		);

		if (singleCatalog) {
			directoryTree.children.push(searchDirectoryTree);
		} else {
			const catalogDirectory = directoryTree.children.find((v) => v.name === catalogName) as DirectoryInfoBasic;
			assert(catalogDirectory, "not found catalog directory in directory tree");
			catalogDirectory.children.push(searchDirectoryTree);
		}

		if (customStyles) {
			const cssPath = pathPrefix
				? targetDir.join(new Path([pathPrefix, CUSTOM_STYLE_FILENAME]))
				: targetDir.join(new Path(CUSTOM_STYLE_FILENAME));
			await this._params.fp.write(cssPath, customStyles);
			const customStyleLinkTag = this._createCustomStyleLinkTag(pathPrefix);
			this._params.html = this._params.html.replace(htmlTags.styles, `${customStyleLinkTag}\n${htmlTags.styles}`);
		}

		const dataJsContent = `window.${InitialDataKeys.DIRECTORY} = ${this._stringifyDataSafely(directoryTree)};`;

		const dataJsHash = this._generateHash(dataJsContent);
		const dataJsFilename = `data.${dataJsHash}.js`;

		const dataJsPath = pathPrefix
			? targetDir.join(new Path([pathPrefix, dataJsFilename]))
			: targetDir.join(new Path(dataJsFilename));
		await this._params.fp.write(dataJsPath, dataJsContent);

		await logStep("Writing rendered HTML files", () =>
			this._writingRenderedHtmlFiles(rendered, targetDir, catalogName, dataJsFilename, zipFilename, singleCatalog),
		);

		if (baseUrl)
			await logStep("Creating sitemap.xml & robots.txt", () => this._writeSEOFiles(baseUrl, catalog, targetDir));
	}

	private _createSearchIndexes = async (catalog: Catalog, targetDir: Path, pathPrefix?: string) => {
		const indexDir = pathPrefix ? targetDir.join(new Path(pathPrefix)) : targetDir;
		const { cacheFileProvider, articleStorageFileProvider } =
			this._params.getCache.fp?.() ?? createModulithFileProviders(indexDir);
		const client = await resolveBackendModule("getModulithSearchClient")({
			cacheFileProvider,
			articleStorageFileProvider,
		});

		const modulithService = await createModulithService({
			parser: this._params.app.parser,
			parserContextFactory: this._params.app.parserContextFactory,
			wm: this._params.app.wm,
			resourceParseClient: undefined,
			localClient: client,
		});

		await modulithService.updateCatalog(catalog.name, STATIC_WORKSPACE_PATH);
		await modulithService.terminate();

		const tree = await this._params.getCache.tree();
		return tree;
	};

	private _writingRenderedHtmlFiles = async (
		htmlDatas: HtmlData[],
		targetDir: Path,
		catalogName: string,
		dataJsFilename: string,
		zipFilename: string,
		singleCatalog = false,
	) => {
		const config = getConfig();
		config.isProduction = true;
		config.isReadOnly = true;
		(config as StaticConfig).features = getRawEnabledFeatures();

		const pathPrefix = singleCatalog ? "" : catalogName;
		const dataJsSrc = pathPrefix ? `${pathPrefix}/${dataJsFilename}` : dataJsFilename;

		const templateHtml = this._params.html
			.replace(htmlTags.config, `window.${InitialDataKeys.CONFIG} = ${this._stringifyDataSafely(config) ?? "{}"}`)
			.replace(
				htmlTags.fs,
				`<script src="${dataJsSrc}"></script>\n` +
					`<script>window.${InitialDataKeys.ZIP_FILENAME} = "${zipFilename}";</script>\n` +
					`<script>window.${InitialDataKeys.SINGLE_CATALOG} = ${singleCatalog ? "true" : "false"};</script>`,
			);

		const generateHtmlFile = async (htmlData: HtmlData) => {
			const is404Html = htmlData.initialData.data?.articlePageData?.articleProps?.errorCode === 404;
			const dataKey = `window.${InitialDataKeys.DATA} = `;
			const initialData = this._escapeDollars(this._stringifyDataSafely(htmlData.initialData) ?? "{}");

			const getLogicPath = () => {
				const get404Path = () => {
					if (isBrowser) return [htmlData.logicPath, "404.html"];
					if (singleCatalog) return [htmlData.logicPath, "404.html"];
					return [htmlData.logicPath.substring(catalogName.length), "404.html"];
				};

				if (is404Html) return new Path(get404Path());
				if (singleCatalog) {
					return htmlData.logicPath
						? new Path(htmlData.logicPath).join(new Path("index.html"))
						: new Path("index.html");
				}
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

		if (!isBrowser && !singleCatalog)
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

	private _stringifyDataSafely(config: Parameters<JSON["stringify"]>[0]) {
		return JSON.stringify(config).replaceAll("<", "\\u003C");
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

	private _createCustomStyleLinkTag(pathPrefix: string) {
		const href = pathPrefix ? `${pathPrefix}/${CUSTOM_STYLE_FILENAME}` : CUSTOM_STYLE_FILENAME;
		return `<link id="${CUSTOM_STYLE_LINK_ID}" rel="stylesheet" crossorigin href="${href}">`;
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
