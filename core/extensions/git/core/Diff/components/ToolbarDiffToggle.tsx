import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useDiffStore } from "@core-ui/stores/DiffStore/DiffStore.provider";
import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";
import { useIsRevisionCompare } from "@ext/git/actions/Revisions/logic/hooks/useIsRevisionCompare";
import { ToolbarModesToggle } from "@ext/git/core/Diff/components/ToolbarModesToggle";
import { useDiffToggle } from "@ext/git/core/Diff/logic/hooks/useDiffToggle";
import { useIsDiffView } from "@ext/git/core/Diff/logic/hooks/useIsDiffView";
import t from "@ext/localization/locale/translate";
import { useIsStorageConnected } from "@ext/storage/logic/utils/useStorage";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { ToolbarIcon, ToolbarToggleButton, ToolbarTriggerChevron } from "@ui-kit/Toolbar";

export const ToolbarDiffToggle = () => {
	const isReadOnly = PageDataContext.value.conf.isReadOnly;
	const isDiffView = useIsDiffView();
	const isRevision = useIsRevision();
	const isRevisionCompare = useIsRevisionCompare();
	const toggleDiffMode = useDiffToggle();
	const diffEnabled = useDiffStore((state) => !!state?.diff);
	const isStorageConnected = useIsStorageConnected();

	if (!isStorageConnected) return null;

	return (
		<>
			<ToolbarToggleButton
				active={diffEnabled}
				data-testid="tb-diff-toggler"
				disabled={(!isRevision && !isDiffView && isReadOnly) || isRevisionCompare}
				onClick={toggleDiffMode}
				tooltipText={t("editor.diff")}
			>
				<ToolbarIcon icon="diff" />
			</ToolbarToggleButton>
			<ComponentVariantProvider variant="inverse">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<ToolbarTriggerChevron data-testid="tb-diff-sub" sub />
					</DropdownMenuTrigger>
					<DropdownMenuContent className="shadow-hard-base" side="top" sideOffset={8}>
						<ToolbarModesToggle />
					</DropdownMenuContent>
				</DropdownMenu>
			</ComponentVariantProvider>
		</>
	);
};
