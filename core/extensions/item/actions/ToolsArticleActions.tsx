import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import EditMarkdownTrigger from "@ext/article/actions/EditMarkdownTrigger";
import { useCallback } from "react";

interface ToolsArticleActionsProps {
	item: ClientArticleProps;
	isTemplate: boolean;
	isCurrentItem: boolean;
}

export const ArticleEditMarkdownTrigger = (props: ToolsArticleActionsProps) => {
	const { item, isTemplate, isCurrentItem } = props;

	const apiUrlCreator = ApiUrlCreatorService.value;

	const loadContent = useCallback(async () => {
		const res = await FetchService.fetch(apiUrlCreator.getArticleContent(item?.ref?.path));
		if (res.ok) return await res.json();
		return null;
	}, [apiUrlCreator, item?.ref?.path]);

	const saveContent = useCallback(
		async (content: string) => {
			const res = await FetchService.fetch(
				apiUrlCreator.setArticleContent(item?.ref?.path),
				content,
				MimeTypes.text,
				Method.POST,
				false,
			);
			if (!isCurrentItem || !res.ok) return refreshPage();
			ArticleUpdaterService.setUpdateData(await res.json());
			if (isCurrentItem && item.errorCode) refreshPage();
		},
		[apiUrlCreator, item?.ref?.path, item?.errorCode, isCurrentItem],
	);

	if (!item) return null;

	return (
		<EditMarkdownTrigger
			isCurrentItem={isCurrentItem}
			isTemplate={isTemplate}
			loadContent={loadContent}
			saveContent={saveContent}
		/>
	);
};
