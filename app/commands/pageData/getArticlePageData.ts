import type PageDataContext from "@core/Context/PageDataContext";
import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import type { ArticlePageDataParams } from "@core/SitePresenter/types/PageDataParams";
import resolveArticlePageData from "../../../core/extensions/article/utils/resolveArticlePageData";
import { Command } from "../../types/Command";

const getArticlePageData: Command<ArticlePageDataParams, { data: ArticlePageData; context: PageDataContext }> =
	Command.create({
		path: "page/getArticlePageData",

		flags: ["otel-omit-result"],

		async do(props: ArticlePageDataParams) {
			return resolveArticlePageData(this._app, this._commands, props);
		},
	});

export default getArticlePageData;
