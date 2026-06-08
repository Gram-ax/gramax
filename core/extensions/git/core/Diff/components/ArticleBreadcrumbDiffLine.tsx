import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ProseMirrorDiffLine from "@ext/git/core/Diff/components/ProseMirrorDiffLine";
import { useSideBarData } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import type { ProseMirrorDiffLine as DiffLineType } from "@ext/git/core/Diff/logic/model/ProseMirrorDiffLine";
import { getDiff } from "@ext/VersionControl/DiffHandler/DiffHandler";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { memo, useEffect, useMemo, useState } from "react";

export const ArticleBreadcrumbDiffLine = memo(() => {
	const [rect, setRect] = useState<{ left: number; top: number; height: number }>(null);
	const sideBarData = useSideBarData();
	const articleProps = ArticlePropsService.value;
	const articleRef = ArticleRefService.value;

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!sideBarData || sideBarData.data.status !== FileStatus.rename) return;
		const resize = () => {
			const breadcrumb = articleRef.current.querySelector(".article-breadcrumb");
			if (!breadcrumb) return;

			const rect = breadcrumb.getBoundingClientRect();
			const top = rect.top;
			const height = rect.height;
			setRect({ left: 2, top, height });
		};

		resize();
	}, [sideBarData]);

	const diffLine = useMemo((): DiffLineType => {
		if (!sideBarData) return null;
		return {
			type: "breadcrumb",
			diff: {
				hunks: getDiff(sideBarData.data.filePath.oldPath, sideBarData.data.filePath.path, { words: false })
					.changes,
			},
			oldContent: [],
			oldDecorations: [],
			pos: null,
		};
	}, [sideBarData]);

	if (!rect || !sideBarData || sideBarData.data.status !== FileStatus.rename) return null;
	return (
		<ProseMirrorDiffLine
			articlePath={articleProps.ref.path}
			diffLine={diffLine}
			height={rect.height}
			left={rect.left}
			oldScope={null}
			top={rect.top}
		/>
	);
});
