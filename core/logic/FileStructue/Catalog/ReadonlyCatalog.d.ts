import type Path from "@core/FileProvider/Path/Path";
import type { CatalogAliases } from "@core/FileStructue/Alias/CatalogAliases";
import type { Article } from "@core/FileStructue/Article/Article";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type { ArticleFilter, Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item, ItemProps } from "@core/FileStructue/Item/Item";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type PathnameData from "@core/RouterPath/model/PathnameData";
import type AgentResourcesProvider from "@ext/agent/prompts/agentResourcesProvider";
import type PromptProvider from "@ext/ai/logic/PromptProvider";
import type CatalogViewProvider from "@ext/catalog/views/logic/CatalogViewProvider";
import type Repository from "@ext/git/core/Repository/Repository";
import type InboxProvider from "@ext/inbox/logic/InboxProvider";
import type CommentProvider from "@ext/markdown/elements/comment/edit/logic/CommentProvider";
import type FragmentProvider from "@ext/markdown/elements/fragment/logic/FragmentProvider";
import type IconProvider from "@ext/markdown/elements/icon/logic/IconProvider";
import type CatalogLinksProvider from "@ext/properties/logic/CatalogLinksProvider";
import type IPermission from "@ext/security/logic/Permission/IPermission";
import type TemplateProvider from "@ext/templates/logic/TemplateProvider";

export interface ReadonlyCatalog<P extends CatalogProps = CatalogProps> extends ReadonlyBaseCatalog<P> {
	get deref(): Catalog<P>;

	get perms(): IPermission;
	get customProviders(): {
		inboxProvider: InboxProvider;
		templateProvider: TemplateProvider;
		promptProvider: PromptProvider;
		agentResourcesProvider: AgentResourcesProvider;
		fragmentProvider: FragmentProvider;
		iconProvider: IconProvider;
		linksProvider: CatalogLinksProvider;
		commentProvider: CommentProvider;
		viewProvider: CatalogViewProvider;
	};

	getRootCategory(): Category<P>;
	getRootCategoryRef(): ItemRef;
	getRootCategoryPath(): Path;
	getRepositoryRelativePath(ref: Path | ItemRef): Path;

	getItemRefPath(relativeRepoPath: Path): Path;
	getItems(): Item[];
	getContentItems(): Article[];
	getCategories(): Category[];
	getCategoryItems(category: Category): Item[];

	findItemByItemPath<T extends Item = Item>(itemPath: Path): T;
	findItemByItemRef<T extends Item = Item>(itemRef: ItemRef): T;
	findArticleByItemRef(itemRef: ItemRef): Article;
	findCategoryByItemRef(itemRef: ItemRef): Category;
	findArticle(logicPath: string, filters: ArticleFilter[], root?: Category<P>): Article;

	get aliases(): CatalogAliases;

	getNeededPermission(): IPermission;

	getPathname(item?: Item): Promise<string>;
	getPathnameData(item: Item): Promise<PathnameData>;
}

export interface ReadonlyBaseCatalog<P extends CatalogProps = CatalogProps, I extends ItemProps = ItemProps> {
	get name(): string;
	get basePath(): Path;
	get props(): P;
	get perms(): IPermission;
	get repo(): Repository;
	get deref(): BaseCatalog<P, I>;
	getRootCategoryDirectoryPath(): Path;
	getRelativeRootCategoryPath(): Path;
	getPathname(item?: Item<I>): Promise<string>;
	getPathnameData(item: Item<I>): Promise<PathnameData>;
}
