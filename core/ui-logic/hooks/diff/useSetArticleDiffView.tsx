import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import DiffViewModeService from "@core-ui/ContextServices/DiffViewModeService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useWatch from "@core-ui/hooks/useWatch";
import Path from "@core/FileProvider/Path/Path";
import { css } from "@emotion/react";
import getSideBarData from "@ext/git/actions/Publish/logic/getSideBarData";
import getSideBarElementByModelIdx, {
	SideBarElementData,
} from "@ext/git/actions/Publish/logic/getSideBarElementByModelIdx";
import { useResourceView } from "@ext/git/actions/Publish/logic/useResourceView";
import SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import SideBarResourceData from "@ext/git/actions/Publish/model/SideBarResourceData";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ArticleDiffViewWrapper from "@ext/markdown/elements/diff/components/ArticleDiffViewWrapper";
import type { DiffItem, DiffResource } from "@ext/VersionControl/model/Diff";
import { useCallback, useRef } from "react";

const diffStyles = css`
	.width-wrapper {
		width: auto !important;
		margin-left: 0 !important;

		> .scrollableContent {
			overflow-x: auto;
			overflow-y: hidden;
			position: relative;
			margin-left: 0 !important;
		}
	}

	.article-default-content {
		max-width: calc(var(--article-max-width) * 2);
	}

	.main-article {
		max-width: var(--article-max-width);
	}

	.article-page-wrapper {
		justify-content: center;
	}
`.styles;

const getUniqueKey = (path: string, scope: TreeReadScope, deleteScope: TreeReadScope) => {
	return path + (scope ? "-" + JSON.stringify(scope) : "") + (deleteScope ? "-" + JSON.stringify(deleteScope) : "");
};

const setArticleView = (
	data: SideBarElementData,
	apiUrlCreator: ApiUrlCreator,
	useDefaultStyles: boolean,
	isReadOnly: boolean,
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
		const path = sideBarData.data.filePath.path;
		const uniqueKey = getUniqueKey(path, scope, deleteScope);
		ArticleViewService.setView(
			() => (
				<ArticleDiffViewWrapper
					key={uniqueKey}
					sideBarData={sideBarData}
					scope={scope}
					oldScope={deleteScope}
					isReadOnly={isReadOnly}
				/>
			),
			useDefaultStyles,
			diffStyles,
		);
	}
};

interface SetArticleDiffViewProps {
	diff: DiffItem | DiffResource;
	apiUrlCreator: ApiUrlCreator;
	useDefaultStyles: boolean;
	isReadOnly: boolean;
	scope?: TreeReadScope;
	deleteScope?: TreeReadScope;
}

const SetArticleDiffView = ({
	diff,
	apiUrlCreator,
	useDefaultStyles,
	scope,
	deleteScope,
	isReadOnly,
}: SetArticleDiffViewProps) => {
	const sideBarData = getSideBarData(diff ? [diff] : [], true, diff.type === "resource");
	setArticleView(
		getSideBarElementByModelIdx(0, sideBarData),
		apiUrlCreator,
		useDefaultStyles,
		isReadOnly,
		scope,
		deleteScope,
	);
};

const useSetArticleDiffView = (isReadOnly: boolean, scope?: TreeReadScope, deleteScope?: TreeReadScope) => {
	const diffViewMode = DiffViewModeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const useDefaultStylesRef = useRef(diffViewMode === "wysiwyg");

	useWatch(() => {
		useDefaultStylesRef.current = diffViewMode === "wysiwyg";
	}, [diffViewMode]);

	const SetArticleDiffViewMemo = useCallback(
		(diff: DiffItem | DiffResource) => {
			return SetArticleDiffView({
				diff,
				apiUrlCreator,
				useDefaultStyles: useDefaultStylesRef.current,
				isReadOnly,
				scope,
				deleteScope,
			});
		},
		[scope, deleteScope],
	);

	return SetArticleDiffViewMemo;
};

export default useSetArticleDiffView;
