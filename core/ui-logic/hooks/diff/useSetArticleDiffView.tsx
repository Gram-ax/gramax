import Path from "@core/FileProvider/Path/Path";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useWatch from "@core-ui/hooks/useWatch";
import { css } from "@emotion/react";
import getSideBarData from "@ext/git/actions/Publish/logic/getSideBarData";
import getSideBarElementByModelIdx, {
	type SideBarElementData,
} from "@ext/git/actions/Publish/logic/getSideBarElementByModelIdx";
import { useResourceView } from "@ext/git/actions/Publish/logic/useResourceView";
import type SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import type SideBarResourceData from "@ext/git/actions/Publish/model/SideBarResourceData";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import ArticleDiffViewWrapper from "@ext/markdown/elements/diff/components/ArticleDiffViewWrapper";
import { useDiffViewMode } from "@ext/markdown/elements/diff/components/store/DiffViewModeStore";
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
	return `${path}${scope ? `-${JSON.stringify(scope)}` : ""}${deleteScope ? `-${JSON.stringify(deleteScope)}` : ""}`;
};

const setArticleView = (
	data: SideBarElementData,
	useDefaultStyles: boolean,
	isReadOnly: boolean,
	scope?: TreeReadScope,
	deleteScope?: TreeReadScope,
) => {
	if (data.sideBarDataElement?.isResource) {
		const sideBarResourceData = data.sideBarDataElement as SideBarResourceData;
		const parentPath = sideBarResourceData.parentPath;

		const relativeTo = new Path(parentPath.path);
		const oldRelativeTo = parentPath.oldPath ? new Path(parentPath.oldPath) : undefined;

		// biome-ignore lint/correctness/useHookAtTopLevel: expected
		const resourceView = useResourceView({
			parentPath,
			id: data.relativeIdx ?? data.idx,
			resourcePath: new Path(data.sideBarDataElement.data.filePath.path),
			oldResourcePath: new Path(data.sideBarDataElement.data.filePath.oldPath),
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
		const ArticleDiffView = () => (
			<ArticleDiffViewWrapper
				isReadOnly={isReadOnly}
				key={uniqueKey}
				oldScope={deleteScope}
				scope={scope}
				sideBarData={sideBarData}
			/>
		);
		ArticleViewService.setView(ArticleDiffView, useDefaultStyles, diffStyles);
	}
};

interface SetArticleDiffViewProps {
	diff: DiffFlattenTreeAnyItem;
	useDefaultStyles: boolean;
	isReadOnly: boolean;
	scope?: TreeReadScope;
	deleteScope?: TreeReadScope;
}

const SetArticleDiffView = ({ diff, useDefaultStyles, scope, deleteScope, isReadOnly }: SetArticleDiffViewProps) => {
	const sideBarData = getSideBarData(diff ? [diff] : [], true, diff.type === "resource");
	setArticleView(getSideBarElementByModelIdx(0, sideBarData), useDefaultStyles, isReadOnly, scope, deleteScope);
};

const useSetArticleDiffView = (isReadOnly: boolean, scope?: TreeReadScope, deleteScope?: TreeReadScope) => {
	const diffViewMode = useDiffViewMode();
	const isWysiwyg = diffViewMode === "wysiwyg-single" || diffViewMode === "wysiwyg-double";
	const useDefaultStylesRef = useRef(isWysiwyg);

	useWatch(() => {
		useDefaultStylesRef.current = isWysiwyg;
	}, [diffViewMode]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const SetArticleDiffViewMemo = useCallback(
		(diff: DiffFlattenTreeAnyItem) => {
			return SetArticleDiffView({
				diff,
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
