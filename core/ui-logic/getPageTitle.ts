import type { PageProps } from "@components/Pages/models/Pages";
import t from "@ext/localization/locale/translate";

const getPageTitle = (data: PageProps): string => {
	if (data?.page !== "article") return "Gramax";
	return joinTitles(data.data.articleProps.title, data.data.catalogProps.title);
};

export const joinTitles = (articleTitle: string, catalogTitle: string): string =>
	`${articleTitle || t("article.no-name")} | ${catalogTitle || t("article.no-name")}`;

export default getPageTitle;
