import { getConfig } from "@app/config/AppConfig";

import { getExecutingEnvironment } from "@app/resolveModule/env";
import { DirectoryInfoBasic } from "@app/resolveModule/fscall/static";
import Application from "@app/types/Application";
import Path from "@core/FileProvider/Path/Path";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import StaticRenderer from "./StaticRenderer";
import { logStepWithErrorSuppression, logStep } from "./cli/utils/logger";
import { HtmlData } from "./ArticleTypes";
import { STORAGE_DIR_NAME } from "@app/config/const";
import { dirname } from "path";
import { joinTitles } from "@core-ui/getPageTitle";
import { InitialDataKeys, StaticConfig } from "./initialDataUtils/types";
import StaticContentCopier, { CopyTemplatesFunction, StaticFileProvider } from "./StaticContentCopier";
import generateStaticSeo from "./StaticSeoGenerator";
import { getRawEnabledFeatures } from "@ext/toggleFeatures/features";

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

class StaticSiteBuilder {
	constructor(private _fp: StaticFileProvider, private _app: Application, private _html: string) {}
	static readonly readonlyDir = "../bundle";

	async generate(catalog: Catalog, targetDir: Path, options: StaticSiteGenerationOptions = {}) {
		const { copyTemplate, customStyles, baseUrl } = options;
		const catalogName = catalog.name;

		const directoryCopier = new StaticContentCopier(this._fp, this._app);
		await logStepWithErrorSuppression("Copying directory", () => directoryCopier.copyCatalog(catalog, targetDir));
		const { directoryTree, wordTemplates, pdfTemplates } = await directoryCopier.copyWordTemplates(copyTemplate);

		const { rendered, searchDirectoryTree } = await logStepWithErrorSuppression(
			"Rendering HTML pages",
			async () => {
				return {
					rendered: await new StaticRenderer(this._app, { wordTemplates, pdfTemplates }).render(catalogName),
					searchDirectoryTree: await this._createSearchIndexes(catalog, targetDir),
				};
			},
		);

		directoryTree.children.push(searchDirectoryTree);

		if (customStyles) {
			await this._fp.write(targetDir.join(new Path([catalogName, CUSTOM_STYLE_FILENAME])), customStyles);
			const customStyleLinkTag = this._createCustomStyleLinkTag(catalogName);
			this._html = this._html.replace(htmlTags.styles, customStyleLinkTag + "\n" + htmlTags.styles);
		}

		await this._fp.write(
			targetDir.join(new Path([catalogName, "data.js"])),
			`window.${InitialDataKeys.DIRECTORY} = ${JSON.stringify(directoryTree)}`,
		);

		await logStep("Writing rendered HTML files", () =>
			this._writingRenderedHtmlFiles(rendered, targetDir, catalogName),
		);

		if (baseUrl)
			await logStep("Creating sitemap.xml & robots.txt", () => this._writeSEOFiles(baseUrl, catalog, targetDir));
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

	private _writingRenderedHtmlFiles = async (htmlDatas: HtmlData[], targetDir: Path, catalogName: string) => {
		const config = getConfig();
		config.isReadOnly = true;
		(config as StaticConfig).features = getRawEnabledFeatures();

		const templateHtml = this._html
			.replace(htmlTags.config, `window.${InitialDataKeys.CONFIG} = ` + (JSON.stringify(config) ?? "{}"))
			.replace(htmlTags.fs, `<script src="${catalogName}/data.js"></script>`);

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
			await this._fp.mkdir(new Path(dirname(filePath.value)));
			await this._fp.write(filePath, html);
		};

		if (!isBrowser)
			await this._fp.write(targetDir.join(new Path("index.html")), this._getRedirectHTML(catalogName));

		for (const htmlData of htmlDatas) await generateHtmlFile(htmlData);
	};

	private async _writeSEOFiles(baseUrl: string, catalog: Catalog, targetDir: Path) {
		const sanitizeBaseUrl = baseUrl.trim().replace(/\/+$/, "");
		const workspace = this._app.wm.current();
		const SEOFiles = await generateStaticSeo(sanitizeBaseUrl, catalog, workspace);
		await SEOFiles.mapAsync(async ({ content, name }) => {
			await this._fp.write(targetDir.join(new Path(isBrowser ? [catalog.name, name] : name)), content);
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
}

export default StaticSiteBuilder;
