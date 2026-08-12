import { useRouter } from "@core/Api/useRouter";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";
import { useIsDiffView } from "@ext/git/core/Diff/logic/hooks/useIsDiffView";
import t from "@ext/localization/locale/translate";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { useCallback } from "react";

export const ToolbarMarkdownModeToggle = () => {
	const router = useRouter();
	const isReadOnly = PageDataContext.value.conf.isReadOnly;
	const isDiffView = useIsDiffView();
	const isRevision = useIsRevision();
	const isMarkdown = router.query?.mode === "markdown";

	const toggleMarkdownMode = useCallback(() => {
		router.pushQuery({ ...(router.query || {}), mode: isMarkdown ? undefined : "markdown" });
	}, [isMarkdown, router]);

	return (
		<ToolbarToggleButton
			active={isMarkdown}
			disabled={!isRevision && !isDiffView && isReadOnly}
			onClick={toggleMarkdownMode}
			tooltipText={t("editor.modes.source-text")}
		>
			<ToolbarIcon icon="markdown" />
		</ToolbarToggleButton>
	);
};
