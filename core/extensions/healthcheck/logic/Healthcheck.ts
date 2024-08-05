import { GRAMAX_EDITOR_URL } from "@app/config/const";
import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import { CatalogErrorGroups } from "@core/FileStructue/Catalog/CatalogErrorGroups";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import RuleProvider from "@ext/rules/RuleProvider";
import Path from "../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../logic/FileProvider/model/FileProvider";
import { Catalog } from "../../../logic/FileStructue/Catalog/Catalog";
import { Item } from "../../../logic/FileStructue/Item/Item";
import ResourceExtensions from "../../../logic/Resource/ResourceExtensions";

export type CatalogErrors = Record<keyof typeof CatalogErrorGroups, CatalogError[]>;

export interface CatalogError {
	code: string;
	message: string;
	args?: CatalogErrorArgs;
}

export interface CatalogErrorArgs {
	value: string;
	editorLink: string;
	title: string;
	logicPath: string;
}

class Healthcheck {
	constructor(private _fp: FileProvider, private _ctx: Context, private _catalog: Catalog) {}

	private _errors: CatalogErrors;

	async checkCatalog(): Promise<CatalogErrors> {
		if (!this._catalog) return {};
		this._errors = { icons: [], links: [], images: [], diagrams: [], fs: [] };
		const rp = new RuleProvider(this._ctx);
		const filters = rp.getItemFilters();

		for (const item of this._catalog.getContentItems()) {
			if (!filters.every((f) => f(item, this._catalog))) continue;

			if (!item.parsedContent) continue;

			for (const resource of item.parsedContent.resourceManager.resources) {
				await this._checkResource(item, resource);
			}
			for (const resource of item.parsedContent.linkManager.resources) {
				await this._checkLink(item, resource);
			}
			for (const iconCode of item.parsedContent.icons) {
				await this._checkIcons(item, iconCode);
			}
		}

		const categories = this._catalog.getCategories();
		for (const category of categories) {
			if (!filters.every((f) => f(category, this._catalog))) continue;

			const refs = category?.props?.refs;

			if (refs) {
				for (const key of Object.keys(refs)) {
					const refPath = new Path(refs[key]);
					const fileNamePath = new Path(refPath.name + ".md");
					const directoryPath = refPath.parentDirectoryPath;
					const filePath = category.ref.path.parentDirectoryPath.join(directoryPath, fileNamePath);
					if (!(await this._fp.exists(filePath))) {
						this._errors.links.push(
							this._getRefCatalogError({
								value: refs[key],
								editorLink: await this._getErrorLink(this._catalog, category),
								title: category.getTitle() ?? new Path(category.logicPath).name,
								logicPath: category.logicPath,
							}),
						);
					}
				}
			}
		}
		return this._errors;
	}

	private _getRefCatalogError = (args?: CatalogErrorArgs) => ({
		code: "InvalidRef",
		message: "Invalid reference detected!",
		args,
	});

	private _pathExists = async (item: Article, resource: Path) => {
		const path = !resource.extension ? resource.join(new Path("_index.md")) : resource;
		return await item.parsedContent.resourceManager.exists(path);
	};

	private _checkLink = async (item: Article, resource: Path) => {
		if (await this._pathExists(item, resource)) return;
		this._errors.links.push(
			this._getRefCatalogError({
				value: resource.value,
				logicPath: item.logicPath,
				title: item.getTitle(),
				editorLink: await this._getErrorLink(this._catalog, item),
			}),
		);
	};

	private _checkResource = async (item: Article, resource: Path) => {
		if (await this._pathExists(item, resource)) return;

		const refCatalogError = this._getRefCatalogError({
			value: decodeURIComponent(resource.value),
			logicPath: item.logicPath,
			title: item.getTitle(),
			editorLink: await this._getErrorLink(this._catalog, item),
		});

		if (ResourceExtensions.diagrams.includes(resource.extension))
			return this._errors.diagrams.push(refCatalogError);

		if (ResourceExtensions.images.includes(resource.extension))
			return this._errors.images.push(refCatalogError);

		return this._errors.fs.push(refCatalogError);
	};

	private _getErrorLink = async (catalog: Catalog, item: Item): Promise<string> => {
		return GRAMAX_EDITOR_URL + "/" + RouterPathProvider.getPathname(await catalog.getPathnameData(item)).value;
	};

	private async _checkIcons(item: Article, code: string) {
		if ((await this._catalog.iconProvider.getIconByCode(code)) || LucideIcon(code)) return;
		this._errors.icons.push(
			this._getRefCatalogError({
				value: code,
				logicPath: item.logicPath,
				title: item.getTitle(),
				editorLink: await this._getErrorLink(this._catalog, item),
			}),
		);
	}
}

export default Healthcheck;
