import { useRouter } from "@core/Api/useRouter";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";
import { updateDiffViewMode, useDiffViewMode } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { getDiffViewMode, getIsDoublePanel, getIsSourceText } from "@ext/git/core/Diff/components/ToolbarModesToggle";
import { useIsDiffView } from "@ext/git/core/Diff/logic/hooks/useIsDiffView";
import t from "@ext/localization/locale/translate";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { useCallback } from "react";

export const ToolbarMarkdownModeToggle = () => {
	const router = useRouter();
	const isReadOnly = PageDataContext.value.conf.isReadOnly;
	const diffViewMode = useDiffViewMode();
	const isDiffView = useIsDiffView();
	const isRevision = useIsRevision();
	const isActive = router.query?.mode === "markdown";

	const hasWysiwyg = diffViewMode === "wysiwyg-single" || diffViewMode === "wysiwyg-double";

	const toggleMarkdownMode = useCallback(() => {
		if (!isDiffView) return router.pushQuery({ mode: isActive ? undefined : "markdown" });
		updateDiffViewMode(getDiffViewMode(getIsDoublePanel(diffViewMode), !getIsSourceText(diffViewMode, hasWysiwyg)));
	}, [diffViewMode, hasWysiwyg, isDiffView, isActive, router]);

	if (isReadOnly && !isDiffView && !isRevision) return null;

	return (
		<ToolbarToggleButton
			active={isActive}
			disabled={isReadOnly && isRevision}
			onClick={toggleMarkdownMode}
			tooltipText={t("editor.modes.source-text")}
		>
			<ToolbarIcon icon="markdown" />
		</ToolbarToggleButton>
	);
};
