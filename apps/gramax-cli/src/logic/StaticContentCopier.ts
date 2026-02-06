import type Application from "@app/types/Application";
import type MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Article, ArticleProps } from "@core/FileStructue/Article/Article";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import ZipFileProvider from "@ext/static/logic/ZipFileProvider";
import assert from "assert";
import crypto from "crypto-js";
import CliUserError from "./CliUserError";
import type { DirectoryInfoBasic } from "./initialDataUtils/types";

export type StaticFileProvider = Pick<FileProvider, "write" | "copy" | "mkdir" | "getItems">;
type CopyFileFunction = (from: Path, to: Path, fp?: StaticFileProvider) => Promise<void>;
export type CopyTemplatesFunction = (copyFile: CopyFileFunction) => Promise<string[]>;

/**
 * Sorts arrays for deterministic order to ensure consistent file hashes and cache-busting.
 * This prevents different build outputs for identical content due to iteration order variations.
 */
function sortForDeterministicOrder<T extends { ref?: { path: { value: string } } } | { value: string }>(
	items: T[],
	getSortKey: (item: T) => string,
): T[] {
	return [...items].sort((a, b) => getSortKey(a).localeCompare(getSortKey(b)));
}

interface DirectoryHelpers {
	copyFile: CopyFileFunction;
	copyFileFromWorkspace: CopyFileFunction;
	copyLogoFile: (logoProp: string, catalog: Catalog) => Promise<void>;
}

class StaticContentCopier {
	constructor(
		private _fp: StaticFileProvider,
		private _app: Application,
	) {}

	private _initialized = true;
	private _wmPath!: string;
	private _directoryTree!: DirectoryInfoBasic;
	private _helpers!: DirectoryHelpers;
	private _folderPath: string;
	private _wfp: MountFileProvider;
	private _catalog!: Catalog;
	private _targetDir!: Path;

	async copyCatalog(catalog: Catalog, targetDir: Path) {
		this._initializeContext(catalog, targetDir);
		const catalogItems = await this._parseAndValidateCatalogItems();

		await this._copyRootDirectoryAndLogos();
		const zipFilename = await this._createArticlesZip();
		await this._copySnippets();
		await this._copyIcons();
		await this._copyCatalogItemResources(catalogItems);

		return { zipFilename };
	}

	async copyWordTemplates(copyTemplate?: {
		copyWordTemplatesFunction?: CopyTemplatesFunction;
		copyPdfTemplatesFunction?: CopyTemplatesFunction;
	}) {
		assert(this._initialized);
		if (!copyTemplate) return { directoryTree: this._directoryTree };
		return {
			directoryTree: this._directoryTree,
			wordTemplates: await copyTemplate.copyWordTemplatesFunction(this._helpers.copyFile),
			pdfTemplates: await copyTemplate.copyPdfTemplatesFunction(this._helpers.copyFile),
		};
	}

	private _initializeContext(catalog: Catalog, targetDir: Path) {
		this._initialized = true;
		this._wmPath = this._app.wm.current().path();
		this._directoryTree = { type: "dir", name: "docs", children: [] };
		this._catalog = catalog;
		this._targetDir = targetDir;
		this._helpers = this._createDirectoryHelpers();
		this._folderPath = this._catalog.getRootCategory().folderPath.value;
		this._wfp = this._app.wm.current().getFileProvider();
	}

	private _createDirectoryHelpers(): DirectoryHelpers {
		const addToDirectoryTree = (path: string) => {
			const parts = path.split("/");
			let currentDir = this._directoryTree;
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

		const copyFile: CopyFileFunction = async (from, to, fp) => {
			const targetPath = fp ? to : this._targetDir.join(to);
			await (fp || this._fp).copy(from, targetPath);
			addToDirectoryTree(to.value);
		};

		const copyFileFromWorkspace: CopyFileFunction = async (from, ...props) => {
			const absoluteFrom = new Path(this._wmPath).join(from);
			await copyFile(absoluteFrom, ...props);
		};

		const copyLogoFile = async (logoProp: string, catalog: Catalog) => {
			if (!catalog.props[logoProp]) return;
			await copyFileFromWorkspace(
				catalog.getRootCategoryDirectoryPath().join(new Path(catalog.props[logoProp])),
				new Path(catalog.name).join(new Path(catalog.props[logoProp])),
			);
		};

		return { copyFile, copyLogoFile, copyFileFromWorkspace };
	}

	private async _parseAndValidateCatalogItems() {
		const ctx = await this._app.contextFactory.fromBrowser({ language: "" });
		const sp = this._app.sitePresenterFactory.fromContext(ctx);
		await sp.parseAllItems(this._catalog);

		const items = this._catalog.getContentItems();

		for (const i of items) {
			if (!(await i.parsedContent.read()))
				throw new CliUserError(`Failed to parse ${new Path(this._wmPath).join(i.ref.path).value}`);
		}
		return items;
	}

	private async _copyRootDirectoryAndLogos() {
		const docroot = this._catalog.getRootCategoryRef().path;
		if (await this._wfp.exists(docroot)) {
			await this._helpers.copyFileFromWorkspace(
				docroot,
				new Path(this._catalog.name).join(new Path(docroot.value.replace(this._folderPath, ""))),
			);
			await this._helpers.copyLogoFile("logo", this._catalog);
			await this._helpers.copyLogoFile("logo_dark", this._catalog);
		}
	}

	private async _createArticlesZip() {
		const zipFileProvider = await ZipFileProvider.create();

		const items = sortForDeterministicOrder(this._catalog.getItems(), (item) => item.ref.path.value);

		for (const item of items) {
			const itemPath = item.ref.path;
			const targetArticlePath = new Path(this._catalog.name).join(
				new Path(itemPath.value.replace(this._folderPath, "")),
			);
			await this._helpers.copyFileFromWorkspace(itemPath, targetArticlePath, zipFileProvider);
		}

		const fixedDate = new Date(2000, 0, 1); // 2000-01-01
		zipFileProvider.zip.forEach((_, file) => {
			file.date = fixedDate;
		});

		const buffer = await zipFileProvider.zip.generateAsync({
			type: "nodebuffer",
			compression: "DEFLATE",
			compressionOptions: { level: 9 },
		});

		const zipHash = crypto.MD5(buffer.toString("hex")).toString().substring(0, 8);
		const zipFilename = `${zipHash}.zip`;

		await this._fp.write(this._targetDir.join(new Path([this._catalog.name, zipFilename])), buffer);

		return zipFilename;
	}

	private async _copySnippets() {
		const snippets = await this._catalog.customProviders.snippetProvider.getItems<Article<ArticleProps>>(true);
		const sortedSnippets = sortForDeterministicOrder(snippets, (snippet) => snippet.ref.path.value);

		for (const snippet of sortedSnippets) {
			const path = snippet.ref.path;
			const targetPath = new Path(this._catalog.name).join(new Path(path.value.replace(this._folderPath, "")));
			await this._helpers.copyFileFromWorkspace(path, targetPath);

			await this._copyItemResources(snippet);
		}
	}

	private async _copyIcons() {
		const iconPaths = this._catalog.customProviders.iconProvider.getIconsPaths();
		const sortedIconPaths = sortForDeterministicOrder(iconPaths, (path) => path.value);

		for (const path of sortedIconPaths) {
			const targetPath = new Path(this._catalog.name).join(new Path(path.value.replace(this._folderPath, "")));
			await this._helpers.copyFileFromWorkspace(path, targetPath);
		}
	}

	private async _copyCatalogItemResources(items: Article[]) {
		const sortedItems = sortForDeterministicOrder(items, (item) => item.ref.path.value);
		for (const item of sortedItems) {
			await this._copyItemResources(item);
		}
	}

	private async _copyItemResources(item: Article) {
		const resources = await item.parsedContent.read();
		if (!resources) return;
		const rm = resources.parsedContext.getResourceManager();
		const sortedResources = sortForDeterministicOrder(rm.resources, (resource) => resource.value);

		for (const r of sortedResources) {
			const absolutePath = rm.getAbsolutePath(new Path(decodeURIComponent(r.value)));
			const targetPath = new Path(this._catalog.name).join(
				new Path(absolutePath.value.replace(this._folderPath, "")),
			);
			await this._helpers.copyFileFromWorkspace(absolutePath, targetPath);
		}
	}
}

export default StaticContentCopier;
