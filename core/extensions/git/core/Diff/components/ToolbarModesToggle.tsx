import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";
import {
	setIsDoublePanel,
	useDisabledDoublePanel,
	useDoublePanelLocked,
	useIsDoublePanel,
	useSideBarData,
} from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { useIsDiffView } from "@ext/git/core/Diff/logic/hooks/useIsDiffView";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Switch } from "@ui-kit/Switch";
import { useCallback } from "react";

export const ToolbarModesToggle = () => {
	const isReadOnly = PageDataContext.value.conf.isReadOnly;
	const isDoublePanel = useIsDoublePanel();
	const sidebarData = useSideBarData();
	const disabledDoublePanel = useDisabledDoublePanel();
	const doublePanelLocked = useDoublePanelLocked();
	const isDiffView = useIsDiffView();
	const isRevision = useIsRevision();
	const disabled = !isDiffView || (isReadOnly && isRevision && disabledDoublePanel) || doublePanelLocked;

	const onDoublePanelChange = useCallback(() => {
		setIsDoublePanel(!isDoublePanel);
	}, [isDoublePanel]);

	return (
		<DropdownMenuItem
			data-testid="tb-double-panel-toggle"
			disabled={disabled || !sidebarData}
			onClick={onDoublePanelChange}
		>
			<Icon icon={"columns-2" as IconCode} />
			{t("diff.double-panel")}
			<Switch checked={isDoublePanel} disabled={disabled || !sidebarData} size="sm" />
		</DropdownMenuItem>
	);
};
