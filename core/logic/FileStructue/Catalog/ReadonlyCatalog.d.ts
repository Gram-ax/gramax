import type { Category } from "@core/FileStructue/Category/Category";

import type Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type { ArticleFilter, Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type { Item, ItemProps } from "@core/FileStructue/Item/Item";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type PathnameData from "@core/RouterPath/model/PathnameData";
import type Repository from "@ext/git/core/Repository/Repository";
import type IconProvider from "@ext/markdown/elements/icon/logic/IconProvider";
import type SnippetProvider from "@ext/markdown/elements/snippet/logic/SnippetProvider";
import type IPermission from "@ext/security/logic/Permission/IPermission";
import type InboxProvider from "@ext/inbox/logic/InboxProvider";
import type TemplateProvider from "@ext/templates/logic/TemplateProvider";
import PromptProvider from "@ext/ai/logic/PromptProvider";
import CatalogLinksProvider from "@ext/properties/logic/CatalogLinksProvider";

export interface ReadonlyCatalog<P extends CatalogProps = CatalogProps> extends ReadonlyBaseCatalog<P> {
	get deref(): Catalog<P>;

	get perms(): IPermission;
	get customProviders(): {
		inboxProvider: InboxProvider;
		templateProvider: TemplateProvider;
		promptProvider: PromptProvider;
		snippetProvider: SnippetProvider;
		iconProvider: IconProvider;
		linksProvider: CatalogLinksProvider;
	};

	getRootCategory(): Category<P>;
	getRootCategoryRef(): ItemRef;
	getRootCategoryPath(): Path;
	getRepositoryRelativePath(ref: Path | ItemRef): Path;

	getItemRefPath(relativeRepoPath: Path): Path;
	getItems(): Item[];
	getContentItems(): Article[];
	getArticles(): Article[];
	getCategories(): Category[];

	findItemByItemPath<T extends Item = Item>(itemPath: Path): T;
	findItemByItemRef<T extends Item = Item>(itemRef: ItemRef): T;
	findArticleByItemRef(itemRef: ItemRef): Article;
	findCategoryByItemRef(itemRef: ItemRef): Category;
	findArticle(logicPath: string, filters: ArticleFilter[], root?: Category<P>): Article;

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
