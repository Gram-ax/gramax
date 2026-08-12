import type {
	ClientArticleProps,
	ClientCatalogProps,
	ClientItemRef,
	OpenGraphData,
} from "@core/SitePresenter/SitePresenter";
import type SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import type { ItemLink } from "@ext/navigation/NavigationLinks";

export type ArticlePageMode = "edit" | "markdown" | "read";

export type ArticleDiffData = { sideBarData: SideBarData; scope: TreeReadScope; oldScope: TreeReadScope };

type BaseArticlePageData = {
	articleProps: ClientArticleProps;
	catalogProps: ClientCatalogProps;
	itemLinks: ItemLink[];
	rootRef?: ClientItemRef;
	mode: ArticlePageMode;
	diff?: ArticleDiffData;
};

type DiffArticlePageOptions = { diff?: true; scope?: string; oldScope?: string };

type BaseArticlePageOptions = DiffArticlePageOptions & {
	mode: ArticlePageMode;
};

export type EditArticlePageData = BaseArticlePageData & {
	content: string;
	mode: "edit";
};
type EditArticlePageOptions = BaseArticlePageOptions & {
	mode: "edit";
};

export type MarkdownArticlePageData = BaseArticlePageData & {
	content: string;
	mode: "markdown";
};
type MarkdownArticlePageOptions = BaseArticlePageOptions & {
	mode: "markdown";
};

export type ReadonlyArticlePageData = BaseArticlePageData & {
	openGraphData: OpenGraphData;
	content: RenderableTreeNodes;
	mode: "read";
};
type ReadonlyArticlePageOptions = BaseArticlePageOptions & {
	mode: "read";
};

export type ArticlePageOptions = EditArticlePageOptions | ReadonlyArticlePageOptions | MarkdownArticlePageOptions;

export type ArticlePageData = EditArticlePageData | ReadonlyArticlePageData | MarkdownArticlePageData;

export type ArticlePageDataWithContent = EditArticlePageData | ReadonlyArticlePageData | MarkdownArticlePageData;
