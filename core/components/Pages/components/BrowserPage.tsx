import HomePage from "@components/HomePage/HomePage";
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import type { PageProps } from "@components/Pages/models/Pages";
import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import ArticleViewContainer from "@core-ui/ContextServices/views/articleView/ArticleViewContainer";
import { memo } from "react";

const CatalogPage = ({ data }: { data: ArticlePageData }) => {
	return (
		<CatalogComponent data={data}>
			<ArticleViewContainer data={data} key={data.articleProps?.ref?.path} />
		</CatalogComponent>
	);
};

export const BrowserPage = memo(({ data }: { data: PageProps }) => {
	return data.page === "article" ? <CatalogPage data={data.data} /> : <HomePage data={data.data} />;
});
