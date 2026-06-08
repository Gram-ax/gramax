import type PageDataContext from "@core/Context/PageDataContext";
import type { HomePageData } from "@core/SitePresenter/SitePresenter";
import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";

interface PageDataMap {
	home: HomePageData;
	article: ArticlePageData;
}

type PageDataByType<T extends PageType> = PageDataMap[T];

export type PageType = "home" | "article";

export type PageDataType = PageDataByType<PageType>;

interface BasePageProps {
	page: PageType;
	context: PageDataContext;
}

export interface HomePageProps extends BasePageProps {
	page: "home";
	data: HomePageData;
}

export interface ArticlePageProps extends BasePageProps {
	page: "article";
	data: ArticlePageData;
}

export type PageProps = Readonly<HomePageProps> | Readonly<ArticlePageProps>;
