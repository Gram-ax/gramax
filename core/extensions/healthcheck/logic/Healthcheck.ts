import Path from "../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../logic/FileProvider/model/FileProvider";
import { Catalog, CatalogErrorArgs, CatalogErrors } from "../../../logic/FileStructue/Catalog/Catalog";
import { Item } from "../../../logic/FileStructue/Item/Item";
import ItemExtensions from "../../../logic/FileStructue/Item/ItemExtensions";
import ResourceExtensions from "../../../logic/Resource/ResourceExtensions";
import ApiUrlCreator from "../../../ui-logic/ApiServices/ApiUrlCreator";
import Language from "../../localization/core/model/Language";
import ParserContextFactory from "../../markdown/core/Parser/ParserContext/ParserContextFactory";

class Healthcheck {
	constructor(
		private _fp: FileProvider,
		private _isServerApp: boolean,
		private _isLogged: boolean,
		private _lang: Language,
		private _parserContextFactory: ParserContextFactory,
	) {}

	async getLinkChecks(catalog: Catalog): Promise<CatalogErrors> {
		const errors: CatalogErrors = {};
		if (!catalog) return {};

		for (const item of catalog.getContentItems()) {
			const context = this._parserContextFactory.fromArticle(item, catalog, this._lang, this._isLogged);

			if (!item.parsedContent) continue;

			const apiUrlCreator = new ApiUrlCreator(
				context.getBasePath().value,
				null,
				null,
				null,
				catalog.getName(),
				item.ref.path.value,
			);

			const resources = item.parsedContent.resourceManager.resources;

			for (const resource of resources) {
				const path = !resource.extension ? resource.join(new Path("_index.md")) : resource;
				if (await item.parsedContent.resourceManager.exist(path, this._fp)) continue;

				if (ItemExtensions.includes(resource.extension) || !resource.extension) {
					if (!errors.Links) errors.Links = [];
					errors.Links.push(
						this._getRefCatalogError({
							linkTo: resource.value,
							logicPath: item.logicPath,
							title: item.props.title,
							editorLink: await this._getErrorLink(catalog, item, apiUrlCreator),
						}),
					);
				} else {
					if (ResourceExtensions.diagrams.includes(resource.extension)) {
						if (!errors.Diagrams) errors.Diagrams = [];
						errors.Diagrams.push(
							this._getRefCatalogError({
								linkTo: resource.value,
								logicPath: item.logicPath,
								title: item.props.title,
								editorLink: await this._getErrorLink(catalog, item, apiUrlCreator),
							}),
						);
					} else {
						if (ResourceExtensions.images.includes(resource.extension)) {
							if (!errors.Images) errors.Images = [];
							errors.Images.push(
								this._getRefCatalogError({
									linkTo: resource.value,
									logicPath: item.logicPath,
									title: item.props.title,
									editorLink: await this._getErrorLink(catalog, item, apiUrlCreator),
								}),
							);
						} else {
							if (!errors.FileStructure) errors.FileStructure = [];
							errors.FileStructure.push(
								this._getRefCatalogError({
									linkTo: resource.value,
									logicPath: item.logicPath,
									title: item.props.title,
									editorLink: await this._getErrorLink(catalog, item, apiUrlCreator),
								}),
							);
						}
					}
				}
			}
		}

		const categories = catalog.getCategories();
		for (const category of categories) {
			const context = this._parserContextFactory.fromArticle(category, catalog, this._lang, this._isLogged);
			const apiUrlCreator = new ApiUrlCreator(
				context.getBasePath().value,
				null,
				null,
				null,
				catalog.getName(),
				category.ref.path.value,
			);

			const refs = category?.props?.refs;

			if (refs) {
				for (const key of Object.keys(refs)) {
					const refPath = new Path(refs[key]);
					const fileNamePath = new Path(refPath.name + ".md");
					const directoryPath = refPath.parentDirectoryPath;
					const filePath = category.ref.path.parentDirectoryPath.join(directoryPath, fileNamePath);
					if (!(await this._fp.exists(filePath))) {
						if (!errors.Links) errors.Links = [];
						errors.Links.push(
							this._getRefCatalogError({
								linkTo: refs[key],
								editorLink: await this._getErrorLink(catalog, category, apiUrlCreator),
								title: category.getProp("title") ?? new Path(category.logicPath).name,
								logicPath: category.logicPath,
							}),
						);
					}
				}
			}
		}
		return errors;
	}

	private _getRefCatalogError = (args?: CatalogErrorArgs) => ({
		code: "InvalidRef",
		message: "Invalid reference detected!",
		args,
	});

	private _getErrorLink = async (catalog: Catalog, item: Item, apiUrlCreator: ApiUrlCreator): Promise<string> => {
		const storage = catalog.getStorage();
		const path = catalog.getRelativeRepPath(item.ref);

		return this._isServerApp ? await storage.getFileLink(path) : apiUrlCreator.getRedirectVScodeUrl().toString();
	};
}

export default Healthcheck;
