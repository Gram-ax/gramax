import Path from "@core/FileProvider/Path/Path";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import debounceFunction from "@core-ui/debounceFunction";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ArticleDiffModeView from "@ext/markdown/elements/diff/components/ArticleDiffModeView";
import LoadingWithDiffBottomBar from "@ext/markdown/elements/diff/components/LoadingWithDiffBottomBar";
import useFetchDiffData from "@ext/markdown/elements/diff/logic/hooks/useFetchDiffData";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { JSONContent } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";

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

	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const isAdded = sideBarData.data.status === FileStatus.new;
	const isDeleted = sideBarData.data.status === FileStatus.delete;
	const isAddedOrDeleted = isAdded || isDeleted;

	const newPath = sideBarData.data.filePath.path;
	const oldPath = sideBarData.data.filePath.oldPath;
	const fullArticlePath = Path.join(catalogName, newPath);

	const content = useRef<string>(null);
	const editTree = useRef<JSONContent>(null);

	const oldContent = useRef<string>(null);
	const oldEditTree = useRef<JSONContent>(null);

	const [isLoading, setIsLoading] = useState(true);

	const fetchDiffData = useFetchDiffData({ isAdded, isDeleted, scope, oldScope, newPath, oldPath });

	const tryGetNewData = async () => {
		const haveNewDataAlready = editTree.current && typeof content.current === "string";
		if (haveNewDataAlready) return;

		if (isAddedOrDeleted) {
			setIsLoading(true);
			const { newData, oldData } = await fetchDiffData(null);
			if (isAdded) {
				content.current = newData?.content;
				editTree.current = newData?.editTree;
			} else {
				oldContent.current = oldData?.content;
				oldEditTree.current = oldData?.editTree;
			}
			setIsLoading(false);
			return;
		}

		const haveOldDataAlready = oldEditTree.current && typeof oldContent.current === "string";
		const onlyNew = !!haveOldDataAlready;

		setIsLoading(true);
		const { newData, oldData } = await fetchDiffData(onlyNew);

		content.current = newData?.content;
		editTree.current = newData?.editTree;
		if (!onlyNew) {
			oldContent.current = oldData?.content;
			oldEditTree.current = oldData?.editTree;
		}
		setIsLoading(false);
	};

	useEffect(() => {
		void tryGetNewData();
	}, []);

	if (isLoading) return <LoadingWithDiffBottomBar filePath={sideBarData.data.filePath} />;

	return (
		<ArticleDiffModeView
			articlePath={newPath}
			changeType={sideBarData.data.status}
			filePath={sideBarData.data.filePath}
			key={newPath}
			newContent={content.current}
			newEditTree={editTree.current}
			newRevision={null}
			newScope={scope}
			oldArticlePath={oldPath === newPath ? undefined : oldPath}
			oldContent={oldContent.current}
			oldEditTree={oldEditTree.current}
			oldRevision={null}
			oldScope={oldScope}
			onMonacoUpdate={(content) => {
				if (isReadOnly) return;
				editTree.current = null;
				debounceFunction(
					DEBOUNCE_SYMBOL,
					async () => {
						await FetchService.fetch(apiUrlCreator.setArticleContent(fullArticlePath, true), content);
					},
					DEBOUNCE_TIME,
				);
			}}
			onViewModeChange={(view) => {
				const isWysiwyg = view === "wysiwyg-single" || view === "wysiwyg-double";
				ArticleViewService.useArticleDefaultStyles = isWysiwyg;
				if (isReadOnly) return;
				void tryGetNewData();
			}}
			onWysiwygUpdate={() => {
				content.current = null;
			}}
			readOnly={isReadOnly}
			title={sideBarData.data.title}
		/>
	);
};

export default ArticleDiffViewWrapper;
