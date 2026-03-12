import { CATEGORY_ROOT_FILENAME, GRAMAX_EDITOR_URL } from "@app/config/const";
import { LucideIcon } from "@components/Atoms/Icon/LucideIcon";
import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import type { CatalogErrorGroups } from "@core/FileStructue/Catalog/CatalogErrorGroups";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { ReadonlyBaseCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import safeDecode from "@core/utils/safeDecode";
import t from "@ext/localization/locale/translate";
import type { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import { collapseTocItems } from "@ext/navigation/article/logic/createTocItems";
import RuleProvider from "@ext/rules/RuleProvider";
import type FileProvider from "../../../logic/FileProvider/model/FileProvider";
import Path from "../../../logic/FileProvider/Path/Path";
import type { Item } from "../../../logic/FileStructue/Item/Item";
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
	isText?: boolean;
}

class Healthcheck {
	private _catalogContentItems: Article[];
	constructor(
		private _fp: FileProvider,
		private _catalog: ContextualCatalog,
	) {}

	private _errors: CatalogErrors;

	async checkCatalog(): Promise<CatalogErrors> {
		if (!this._catalog) return {};
		this._errors = { icons: [], links: [], images: [], diagrams: [], unsupported: [], content: [], comments: [] };
		const rp = new RuleProvider(this._catalog.ctx);
		const ctx = this._catalog.ctx;
		const filters = rp.getItemFilters();

		this._catalogContentItems = this._catalog.getContentItems();

		for (const item of this._catalogContentItems) {
			if (!filters.every((f) => f(item, this._catalog))) continue;

			await item.parsedContent.read(async (p) => {
				if (!p) {
					this._errors.content.push(
						this._getRefCatalogError({
							value: t("markdown-error"),
							logicPath: item.logicPath,
							title: item.getTitle() ?? new Path(item.logicPath).name,
							editorLink: await this._getErrorLink(this._catalog, item),
							isText: true,
						}),
					);
					return;
				}

				const manager = p.parsedContext.getLinkManager();
				const { linkResources, resources } = manager;

				for (const resource of p.parsedContext.getResourceManager().resources) {
					if (resource.value.endsWith(".comments.yaml")) await this._checkComments(item, ctx);
					await this._checkResource(item, resource);
				}

				for (const resource of resources) {
					if (linkResources.length === 0) {
						await this._checkResourceLink(item, resource);
						continue;
					}

					const linkedResource = linkResources.find((lr) => lr.resource.value === resource.value);

					if (!linkedResource) await this._checkResourceLink(item, resource);
					else await this._checkResourceLink(item, linkedResource.resource, linkedResource.hash);
				}

				for (const iconCode of p.parsedContext.icons) {
					await this._checkIcons(item, iconCode);
				}

				await this._checkUnsupported(item, p.renderTree);
			});
		}

		this._errors.unsupported = this.groupAndRename(this._errors.unsupported);

		const categories = this._catalog.getCategories();
		for (const category of categories) {
			if (!filters.every((f) => f(category, this._catalog))) continue;

			const refs = category?.props?.refs;

			if (refs) {
				for (const key of Object.keys(refs)) {
					const refPath = new Path(refs[key]);
					const fileNamePath = new Path(`${refPath.name}.md`);
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
		this._catalogContentItems = undefined;
		return this._errors;
	}

	private _getRefCatalogError = (args?: CatalogErrorArgs) => ({
		code: "InvalidRef",
		message: "Invalid reference detected!",
		args,
	});

	private _pathExists = async (item: Article, resource: Path) => {
		const path = !resource.extension ? resource.join(new Path(CATEGORY_ROOT_FILENAME)) : resource;
		return await item.parsedContent.read((p) => p.parsedContext.getResourceManager().exists(path));
	};

	private _getArticleByResourcePath = async (item: Article, resource: Path) => {
		const path = !resource.extension ? resource.join(new Path(CATEGORY_ROOT_FILENAME)) : resource;
		const absolutePath = await item.parsedContent.read((p) =>
			p.parsedContext.getResourceManager().getAbsolutePath(path),
		);

		let index = 0;
		let article: Article;
		while (index < this._catalogContentItems.length - 1) {
			const item = this._catalogContentItems[index];
			if (item?.ref?.path?.value === absolutePath.value) {
				article = item;
				break;
			}
			index++;
		}

		return article;
	};

	private async _checkResourceLink(item: Article, resource: Path, hash?: string) {
		const isExist = await this._pathExists(item, resource);
		const errorValue = hash ? `${resource.value}${hash}` : resource.value;
		const formattedErrorValue = errorValue.replace(/(?:\.\.\/)+/g, "");
		const pushError = async () => {
			this._errors.links.push(
				this._getRefCatalogError({
					value: formattedErrorValue,
					logicPath: item.logicPath,
					title: item.getTitle(),
					editorLink: await this._getErrorLink(this._catalog, item),
				}),
			);
		};

		if (!isExist) return pushError();

		if (hash) {
			const article = await this._getArticleByResourcePath(item, resource);
			if (!article) return pushError();

			const tocItems = collapseTocItems(await article.parsedContent.read((p) => p?.tocItems ?? []));
			if (!tocItems.length || !tocItems.some(({ url }) => url === safeDecode(hash))) return pushError();
		}
	}

	private _checkResource = async (item: Article, resource: Path) => {
		if (await this._pathExists(item, resource)) return;

		const refCatalogError = this._getRefCatalogError({
			value: resource.value,
			logicPath: item.logicPath,
			title: item.getTitle(),
			editorLink: await this._getErrorLink(this._catalog, item),
		});

		if (ResourceExtensions.diagrams.includes(resource.extension))
			return this._errors.diagrams.push(refCatalogError);

		if (ResourceExtensions.images.includes(resource.extension)) return this._errors.images.push(refCatalogError);
	};

	private _getErrorLink = async (catalog: ReadonlyBaseCatalog, item: Item): Promise<string> => {
		return `${GRAMAX_EDITOR_URL}/${RouterPathProvider.getPathname(await catalog.getPathnameData(item)).value}`;
	};

	private async _checkIcons(item: Article, code: string) {
		if ((await this._catalog.customProviders.iconProvider.getIconByCode(code)) || (await LucideIcon(code))) return;
		this._errors.icons.push(
			this._getRefCatalogError({
				value: code,
				logicPath: item.logicPath,
				title: item.getTitle(),
				editorLink: await this._getErrorLink(this._catalog, item),
			}),
		);
	}

	private async _checkComments(item: Article, ctx: Context) {
		const commentProvider = this._catalog.customProviders.commentProvider;
		const comments = await commentProvider.getComments(item.ref.path);
		if (!comments) return;
		const formatter = new Intl.DateTimeFormat(ctx.contentLanguage, {
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});

		for (const id of Object.keys(comments)) {
			if (commentProvider.isAssigned(id, item.ref.path)) continue;
			const comment = comments[id].parsedData;
			const value = `${comment.comment.user.name}<${comment.comment.user.mail}> ${formatter.format(new Date(comment.comment.dateTime))}`;

			this._errors.comments.push(
				this._getRefCatalogError({
					value,
					logicPath: item.logicPath,
					title: item.getTitle(),
					editorLink: await this._getErrorLink(this._catalog, item),
				}),
			);
		}
	}

	private _checkUnsupported = async (item: Article, tree: RenderableTreeNode) => {
		if (!tree || typeof tree === "string") return;

		if (tree.name === "Unsupported") {
			this._errors.unsupported.push(
				this._getRefCatalogError({
					value: tree?.attributes?.type,
					logicPath: item.logicPath,
					title: item.getTitle(),
					editorLink: await this._getErrorLink(this._catalog, item),
				}),
			);
		}

		if (tree.children) {
			await Promise.all(tree.children.map((n) => this._checkUnsupported(item, n)));
		}
	};

	private groupAndRename(arr: CatalogError[]): CatalogError[] {
		const grouped: { [key: string]: CatalogError & { count: number } } = {};

		arr.forEach((item) => {
			const key = `${item.args.value}_${item.args.logicPath}`;
			if (!grouped[key]) {
				grouped[key] = { ...item, count: 1 };
			} else {
				grouped[key].count += 1;
			}
		});

		return Object.values(grouped).map((item) => {
			if (item.count > 0) {
				item.args.value = `${item.args.value} (${item.count})`;
			}
			delete item.count;
			return item;
		});
	}
}

export default Healthcheck;
