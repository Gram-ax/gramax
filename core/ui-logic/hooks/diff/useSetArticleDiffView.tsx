import type { Router } from "@core/Api/Router";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useWatch from "@core-ui/hooks/useWatch";
import getSideBarData from "@ext/git/actions/Publish/logic/getSideBarData";
import getSideBarElementByModelIdx, {
	type SideBarElementData,
} from "@ext/git/actions/Publish/logic/getSideBarElementByModelIdx";
import { useResourceView } from "@ext/git/actions/Publish/logic/useResourceView";
import type SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import type SideBarResourceData from "@ext/git/actions/Publish/model/SideBarResourceData";
import { useDiffViewMode } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import getScopeFromString from "@ext/git/core/Diff/logic/utils/getScopeFromString";
import getScopeString from "@ext/git/core/Diff/logic/utils/getScopeString";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { useCallback, useRef } from "react";

interface SetArticleDiffViewProps {
	diff: DiffFlattenTreeAnyItem;
	useDefaultStyles: boolean;
	router: Router;
	scope?: TreeReadScope;
	deleteScope?: TreeReadScope;
}

interface SetArticleViewProps extends SetArticleDiffViewProps {
	data: SideBarElementData;
}

const parsePathnameScope = (pathname: string): { cleanPath: string; scopeFromPathname: TreeReadScope | null } => {
	if (!pathname?.includes(":")) return { cleanPath: pathname, scopeFromPathname: null };
	const pathnameData = RouterPathProvider.parsePath(pathname);
	if (!pathnameData.catalogName?.includes(":")) return { cleanPath: pathname, scopeFromPathname: null };
	const [catalogBase, scopeStr] = pathnameData.catalogName.split(":");
	const cleanPath = RouterPathProvider.getPathname({ ...pathnameData, catalogName: catalogBase }).value;
	return { cleanPath, scopeFromPathname: getScopeFromString(scopeStr) };
};

const setArticleView = (props: SetArticleViewProps) => {
	const { data, router, scope, deleteScope, useDefaultStyles } = props;
	if (data.sideBarDataElement?.isResource) {
		const sideBarResourceData = data.sideBarDataElement as SideBarResourceData;
		const parentPath = sideBarResourceData.parentPath;

		const relativeTo = new Path(parentPath.path);
		const oldRelativeTo = parentPath.oldPath ? new Path(parentPath.oldPath) : undefined;

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
		const { cleanPath, scopeFromPathname } = parsePathnameScope(sideBarData.pathname);
		const effectiveDeleteScope = scope ? deleteScope : (scopeFromPathname ?? deleteScope);

		ArticleViewService.useArticleDefaultStyles = useDefaultStyles;
		ArticleViewService.setDefaultView();

		router.setPreventNextPushRefresh(false);
		router.pushPath(cleanPath, {
			mode: "diff",
			scope: getScopeString(scope),
			oldScope: getScopeString(effectiveDeleteScope),
		});
	}
};

const SetArticleDiffView = (props: SetArticleDiffViewProps) => {
	const { diff, router, scope, deleteScope, useDefaultStyles } = props;
	const sideBarData = getSideBarData(diff ? [diff] : [], true, diff.type === "resource");
	setArticleView({
		data: getSideBarElementByModelIdx(0, sideBarData),
		router,
		useDefaultStyles: useDefaultStyles,
		diff,
		scope,
		deleteScope,
	});
};

const useSetArticleDiffView = (scope?: TreeReadScope, deleteScope?: TreeReadScope) => {
	const diffViewMode = useDiffViewMode();
	const isWysiwyg = diffViewMode === "wysiwyg-single" || diffViewMode === "wysiwyg-double";
	const useDefaultStylesRef = useRef(isWysiwyg);
	const router = useRouter();

	useWatch(() => {
		useDefaultStylesRef.current = isWysiwyg;
	}, [diffViewMode]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const SetArticleDiffViewMemo = useCallback(
		(diff: DiffFlattenTreeAnyItem) => {
			return SetArticleDiffView({
				diff,
				scope,
				deleteScope,
				router,
				useDefaultStyles: useDefaultStylesRef.current,
			});
		},
		[scope, deleteScope],
	);

	return SetArticleDiffViewMemo;
};

export default useSetArticleDiffView;
