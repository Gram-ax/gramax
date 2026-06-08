import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";
import {
	updateDiffViewMode,
	useDiffViewMode,
	useDisabledViewModes,
	useDoublePanelLocked,
} from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { useIsDiffView } from "@ext/git/core/Diff/logic/hooks/useIsDiffView";
import type { DiffViewMode } from "@ext/git/core/Diff/logic/model/DiffView";
import t from "@ext/localization/locale/translate";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { useCallback } from "react";

export const getIsDoublePanel = (mode: DiffViewMode) => {
	if (mode === "wysiwyg-single" || mode === "single-panel") return false;
	return true;
};

export const getIsSourceText = (mode: DiffViewMode, hasWysiwyg: boolean) => {
	if (!hasWysiwyg) return true;
	if (mode === "wysiwyg-double" || mode === "wysiwyg-single") return false;
	return true;
};

export const getDiffViewMode = (isDoublePanel: boolean, isSourceText: boolean): DiffViewMode => {
	if (isDoublePanel && isSourceText) return "double-panel";
	if (isDoublePanel && !isSourceText) return "wysiwyg-double";
	if (!isDoublePanel && isSourceText) return "single-panel";
	return "wysiwyg-single";
};

export const ToolbarModesToggle = () => {
	const isReadOnly = PageDataContext.value.conf.isReadOnly;
	const diffViewMode = useDiffViewMode();
	const disabledViewModes = useDisabledViewModes();
	const doublePanelLocked = useDoublePanelLocked();
	const hasWysiwyg = diffViewMode === "wysiwyg-single" || diffViewMode === "wysiwyg-double";
	const isDiffView = useIsDiffView();
	const isRevision = useIsRevision();
	const isActived = isDiffView && (diffViewMode === "wysiwyg-double" || diffViewMode === "double-panel");
	const disabled =
		!isDiffView ||
		(isReadOnly &&
			isRevision &&
			disabledViewModes.includes("double-panel") &&
			disabledViewModes.includes("wysiwyg-double")) ||
		doublePanelLocked;

	const onDoublePanelChange = useCallback(() => {
		updateDiffViewMode(getDiffViewMode(!getIsDoublePanel(diffViewMode), getIsSourceText(diffViewMode, hasWysiwyg)));
	}, [diffViewMode, hasWysiwyg]);

	if (!isDiffView) return null;

	return (
		<ToolbarToggleButton
			active={isActived}
			disabled={disabled}
			onClick={onDoublePanelChange}
			tooltipText={t("diff.double-panel")}
		>
			<ToolbarIcon icon={"columns-2" as IconCode} />
		</ToolbarToggleButton>
	);
};
