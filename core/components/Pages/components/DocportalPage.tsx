import { ArticleReadRenderer } from "@components/Article/ArticleReadRenderer";
import BottomInfo from "@components/HomePage/BottomInfo";
import { HomePageCatalogListContent } from "@components/HomePage/Components/HomePageCatalogListContent";
import { HomePageWrapper } from "@components/HomePage/Components/HomePageWrapper";
import { DocportalTopMenu } from "@components/HomePage/TopMenu/DocportalTopMenu";
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import type { PageProps } from "@components/Pages/models/Pages";
import type { ArticlePageData, HomePageData, ReadonlyArticlePageData } from "@core/SitePresenter/SitePresenter";

const HomePage = ({ data }: { data: HomePageData }) => {
	return (
		<HomePageWrapper>
			<DocportalTopMenu />
			<HomePageCatalogListContent data={data} />
			<BottomInfo />
		</HomePageWrapper>
	);
};

const CatalogPage = ({ data }: { data: ArticlePageData }) => {
	return (
		<CatalogComponent data={data}>
			<ArticleReadRenderer data={data as ReadonlyArticlePageData} />
		</CatalogComponent>
	);
};

export const DocportalPage = ({ data }: { data: PageProps }) => {
	return data.page === "article" ? <CatalogPage data={data.data} /> : <HomePage data={data.data} />;
};
