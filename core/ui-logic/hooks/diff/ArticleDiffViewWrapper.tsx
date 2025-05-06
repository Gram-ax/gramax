import findDiffItemByPath from "@components/Layouts/StatusBar/Extensions/logic/findDiffItemByPath";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import debounceFunction from "@core-ui/debounceFunction";
import Path from "@core/FileProvider/Path/Path";
import SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { DiffTreeItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import PublishChangesProvider from "@ext/git/core/GitPublish/PublishChangesProvider";
import ArticleDiffModeView from "@ext/markdown/elements/diff/components/ArticleDiffModeView";
import { useState } from "react";

const DEBOUNCE_TIME = 200;
const DEBOUNCE_SYMBOL = Symbol();

interface ArticleDiffViewWrapperProps {
	sideBarData: SideBarData;
	scope: TreeReadScope;
	oldScope: TreeReadScope;
	isReadOnly: boolean;
}

const ArticleDiffViewWrapper = (props: ArticleDiffViewWrapperProps) => {
	const { sideBarData, scope, oldScope, isReadOnly } = props;

	const catalogName = CatalogPropsService.value?.name;
	const actualPublishChanges = PublishChangesProvider.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const newPath = sideBarData.data.filePath.path;
	const oldPath = sideBarData.data.filePath.oldPath;
	const articlePath = Path.join(catalogName, newPath);

	const [content, setContent] = useState(sideBarData.data.content);
	const [editTree, setEditTree] = useState(sideBarData.data.newEditTree);

	return (
		<ArticleDiffModeView
			key={newPath}
			filePath={sideBarData.data.filePath}
			oldScope={oldScope}
			newScope={scope}
			oldRevision={null}
			newRevision={null}
			title={sideBarData.data.title}
			oldEditTree={sideBarData.data.oldEditTree}
			newEditTree={editTree}
			oldContent={sideBarData.data.oldContent}
			newContent={content}
			changeType={sideBarData.data.status}
			articlePath={newPath}
			oldArticlePath={oldPath === newPath ? undefined : oldPath}
			onViewModeChange={(view) => {
				ArticleViewService.useArticleDefaultStyles = view === "wysiwyg";
				if (isReadOnly) return;
				const item = findDiffItemByPath(actualPublishChanges, newPath) as DiffTreeItem;
				if (!item) return;
				setContent(item.rawItem.content);
				if (item.rawItem.type === "item") {
					setEditTree(item.rawItem.newEditTree);
				}
			}}
			onMonacoUpdate={(content) => {
				if (isReadOnly) return;
				debounceFunction(
					DEBOUNCE_SYMBOL,
					async () => {
						await FetchService.fetch(apiUrlCreator.setArticleContent(articlePath, true), content);
					},
					DEBOUNCE_TIME,
				);
			}}
			readOnly={isReadOnly}
		/>
	);
};

export default ArticleDiffViewWrapper;
