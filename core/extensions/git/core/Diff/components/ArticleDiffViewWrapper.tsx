import Path from "@core/FileProvider/Path/Path";
import type { ArticleDiffData } from "@core/SitePresenter/types/ArticlePage";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import debounceFunction from "@core-ui/debounceFunction";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import BranchUpdaterService, {
	type OnBranchUpdateListener,
} from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import { PublishEmitter } from "@ext/git/actions/Publish/logic/PublishEmitter";
import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";
import ArticleDiffModeView from "@ext/git/core/Diff/components/ArticleDiffModeView";
import LoadingWithDiffBottomBar from "@ext/git/core/Diff/components/LoadingWithDiffBottomBar";
import {
	setDiffEnabled,
	setDoublePanelLocked,
	setSideBarData,
	useSideBarData,
} from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import useFetchDiffData from "@ext/git/core/Diff/logic/hooks/useFetchDiffData";
import { useResetArticleView } from "@ext/git/core/Diff/logic/hooks/useResetArticleView";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { JSONContent } from "@tiptap/core";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const DEBOUNCE_TIME = 200;
const DEBOUNCE_SYMBOL = Symbol();

interface ArticleDiffViewWrapperProps {
	data: ArticleDiffData;
	isReadOnly: boolean;
}

const ArticleDiffViewWrapper = ({ data, isReadOnly: propsIsReadOnly }: ArticleDiffViewWrapperProps) => {
	const { sideBarData, scope, oldScope } = data;

	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const isRevision = useIsRevision();

	const apiUrlCreator = ApiUrlCreatorService.value;
	const sideBarDataRef = useRef(sideBarData);

	const isAdded = sideBarDataRef.current.data.status === FileStatus.new;
	const isDeleted = sideBarDataRef.current.data.status === FileStatus.delete;
	const isAddedOrDeleted = isAdded || isDeleted;
	const isReadOnly = propsIsReadOnly || isDeleted || isRevision;

	const newPath = sideBarDataRef.current.data.filePath.path;
	const oldPath = sideBarDataRef.current.data.filePath.oldPath;
	const fullArticlePath = Path.join(catalogName, newPath);

	const content = useRef<string>(null);
	const editTree = useRef<JSONContent>(null);

	const oldContent = useRef<string>(null);
	const oldEditTree = useRef<JSONContent>(null);

	const [isLoading, setIsLoading] = useState(true);

	const fetchDiffData = useFetchDiffData({ isAdded, isDeleted, scope, oldScope, newPath, oldPath });

	const tryGetNewData = async () => {
		const haveNewDataAlready = editTree.current && typeof content.current === "string";
		if (!isRevision && haveNewDataAlready) return;

		if (isRevision) {
			const haveOldDataAlready = oldEditTree.current && typeof oldContent.current === "string";
			const haveNewDataAlready = isAdded || (editTree.current && typeof content.current === "string");
			const haveOldDataAlreadyOrNotNeeded = isDeleted || haveOldDataAlready;
			if (haveNewDataAlready && haveOldDataAlreadyOrNotNeeded) return;
			setIsLoading(true);

			try {
				const { newData, oldData } = await fetchDiffData(null);
				oldContent.current = oldData?.content;
				oldEditTree.current = oldData?.editTree;
				content.current = newData?.content;
				editTree.current = newData?.editTree;
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}

			return;
		}

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

	useResetArticleView();

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		setDiffEnabled(true);
		setDoublePanelLocked(isDeleted);
		setSideBarData(sideBarData);
		void tryGetNewData();

		return () => {
			setDiffEnabled(false);
			setDoublePanelLocked(false);
			setSideBarData(null);
		};
	}, []);

	useEffect(() => {
		const onPublishFinish = async () => {
			const sidebarData = sideBarDataRef.current;
			const newSideBarData = {
				...sidebarData,
				data: {
					...sidebarData.data,
					status: FileStatus.current,
					isChanged: false,
					added: 0,
					deleted: 0,
				},
			};
			setSideBarData(newSideBarData);
			sideBarDataRef.current = newSideBarData;
		};

		const onDiscard: OnBranchUpdateListener = (_, caller) => {
			if (caller !== OnBranchUpdateCaller.DiscardNoReset && caller !== OnBranchUpdateCaller.MergeRequest) return;
			const sidebarData = sideBarDataRef.current;
			const newSideBarData = {
				...sidebarData,
				data: {
					...sidebarData.data,
					status: FileStatus.current,
					isChanged: false,
					added: 0,
					deleted: 0,
				},
			};
			setSideBarData(newSideBarData);
			sideBarDataRef.current = newSideBarData;
		};

		const finishToken = PublishEmitter.events.on("finish", onPublishFinish);
		BranchUpdaterService.addListener(onDiscard);
		return () => {
			PublishEmitter.events.off(finishToken);
			BranchUpdaterService.removeListener(onDiscard);
		};
	}, []);

	const changeType = useSideBarData()?.data?.status;
	if (isLoading) return <LoadingWithDiffBottomBar />;

	return (
		<ArticleDiffModeView
			articlePath={newPath}
			changeType={changeType}
			key={newPath}
			newContent={content.current}
			newEditTree={editTree.current}
			newScope={scope}
			oldArticlePath={oldPath === newPath ? undefined : oldPath}
			oldContent={oldContent.current}
			oldEditTree={oldEditTree.current}
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
			onViewModeChange={() => {
				ArticleViewService.useArticleDefaultStyles = true;
				if (isReadOnly) return;
				void tryGetNewData();
			}}
			onWysiwygUpdate={({ editor }) => {
				content.current = editor.state.doc.content.toJSON();
			}}
			readOnly={isReadOnly}
		/>
	);
};

export default ArticleDiffViewWrapper;
