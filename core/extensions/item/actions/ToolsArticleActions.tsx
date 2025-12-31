import useIsFileNew from "@components/Actions/useIsFileNew";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import EnterpriseCheckStyleGuide from "@ext/enterprise/components/EnterpriseCheckStyleGuide";
import History from "../../git/actions/History/component/HistoryTrigger";
import EditMarkdownTrigger from "@ext/article/actions/EditMarkdownTrigger";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import Method from "@core-ui/ApiServices/Types/Method";
import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import { useCallback } from "react";

interface ToolsArticleActionsProps {
	item: ClientArticleProps;
	isTemplate: boolean;
	isCurrentItem: boolean;
}

const ToolsArticleActions = (props: ToolsArticleActionsProps) => {
	const { item, isTemplate, isCurrentItem } = props;
	const isFileNew = useIsFileNew(item);

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
		[apiUrlCreator, item?.ref?.path, isCurrentItem],
	);

	if (!item) return null;

	return (
		<>
			<IsReadOnlyHOC>
				<History key="history" item={item} isFileNew={isFileNew} />
				<EditMarkdownTrigger
					loadContent={loadContent}
					saveContent={saveContent}
					isCurrentItem={isCurrentItem}
					isTemplate={isTemplate}
				/>
			</IsReadOnlyHOC>
			{!item.errorCode && isCurrentItem && <EnterpriseCheckStyleGuide />}
		</>
	);
};

export default ToolsArticleActions;
