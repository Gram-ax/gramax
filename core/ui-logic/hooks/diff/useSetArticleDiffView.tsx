import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import DiffViewModeService from "@core-ui/ContextServices/DiffViewModeService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useWatch from "@core-ui/hooks/useWatch";
import Path from "@core/FileProvider/Path/Path";
import getSideBarData from "@ext/git/actions/Publish/logic/getSideBarData";
import getSideBarElementByModelIdx, {
	SideBarElementData,
} from "@ext/git/actions/Publish/logic/getSideBarElementByModelIdx";
import { useResourceView } from "@ext/git/actions/Publish/logic/useResourceView";
import SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import SideBarResourceData from "@ext/git/actions/Publish/model/SideBarResourceData";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ArticleDiffModeView from "@ext/markdown/elements/diff/components/ArticleDiffModeView";
import type { DiffItem, DiffResource } from "@ext/VersionControl/model/Diff";
import { useCallback, useRef } from "react";

const setArticleView = (
	data: SideBarElementData,
	apiUrlCreator: ApiUrlCreator,
	useDefaultStyles: boolean,
	scope?: TreeReadScope,
	deleteScope?: TreeReadScope,
) => {
	if (data.sideBarDataElement?.isResource) {
		const sideBarResourceData = data.sideBarDataElement as SideBarResourceData;
		const parentPath = sideBarResourceData.parentPath;

		const resourceApiUrlCreator = apiUrlCreator.fromArticle(parentPath.path);
		const oldResourceApiUrlCreator = parentPath.oldPath ? apiUrlCreator.fromArticle(parentPath.oldPath) : undefined;
		const relativeTo = new Path(parentPath.path);
		const oldRelativeTo = parentPath.oldPath ? new Path(parentPath.oldPath) : undefined;

		const resourceView = useResourceView({
			id: data.relativeIdx ?? data.idx,
			apiUrlCreator: resourceApiUrlCreator,
			oldApiUrlCreator: oldResourceApiUrlCreator,
			resourcePath: new Path(data.sideBarDataElement.data.filePath.path),
			oldResourcePath: new Path(data.sideBarDataElement.data.filePath.oldPath),
			newContent: sideBarResourceData.data.content,
			oldContent: sideBarResourceData.data.oldContent,
			relativeTo,
			oldRelativeTo,
			filePath: data.sideBarDataElement.data.filePath,
			status: data.sideBarDataElement.data.status,
			newScope: scope,
			oldScope: deleteScope,
		});

		ArticleViewService.setView(() => resourceView, false);
	} else {
		const sideBarData = data.sideBarDataElement as SideBarData;
		const newPath = sideBarData.data.filePath.path;
		const oldPath = sideBarData.data.filePath.oldPath;
		ArticleViewService.setView(
			() => (
				<ArticleDiffModeView
					key={newPath}
					filePath={sideBarData.data.filePath}
					oldScope={deleteScope}
					newScope={scope}
					oldRevision={null}
					newRevision={null}
					title={sideBarData.data.title}
					oldEditTree={sideBarData.data.oldEditTree}
					newEditTree={sideBarData.data.newEditTree}
					oldContent={sideBarData.data.oldContent}
					newContent={sideBarData.data.content}
					changeType={sideBarData.data.status}
					articlePath={newPath}
					oldArticlePath={oldPath === newPath ? undefined : oldPath}
					onWysiwygUpdate={({ editor }) => (sideBarData.data.newEditTree = editor.getJSON())}
					onViewModeChange={(view) => {
						ArticleViewService.useArticleDefaultStyles = view === "wysiwyg";
					}}
					readOnly
				/>
			),
			useDefaultStyles,
		);
	}
};

interface SetArticleDiffViewProps {
	diff: DiffItem | DiffResource;
	apiUrlCreator: ApiUrlCreator;
	useDefaultStyles: boolean;
	scope?: TreeReadScope;
	deleteScope?: TreeReadScope;
}

const SetArticleDiffView = ({ diff, apiUrlCreator, useDefaultStyles, scope, deleteScope }: SetArticleDiffViewProps) => {
	const sideBarData = getSideBarData(diff ? [diff] : [], true, diff.type === "resource");
	setArticleView(getSideBarElementByModelIdx(0, sideBarData), apiUrlCreator, useDefaultStyles, scope, deleteScope);
};

const useSetArticleDiffView = (scope?: TreeReadScope, deleteScope?: TreeReadScope) => {
	const diffViewMode = DiffViewModeService.value;
	const useDefaultStylesRef = useRef(diffViewMode === "wysiwyg");

	useWatch(() => {
		useDefaultStylesRef.current = diffViewMode === "wysiwyg";
	}, [diffViewMode]);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const SetArticleDiffViewMemo = useCallback(
		(diff: DiffItem | DiffResource) => {
			return SetArticleDiffView({
				diff,
				apiUrlCreator,
				useDefaultStyles: useDefaultStylesRef.current,
				scope,
				deleteScope,
			});
		},
		[apiUrlCreator, scope, deleteScope],
	);

	return SetArticleDiffViewMemo;
};

export default useSetArticleDiffView;
