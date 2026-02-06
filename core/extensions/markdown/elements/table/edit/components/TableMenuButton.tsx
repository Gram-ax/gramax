import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { readyToPlace } from "@ext/markdown/elementsUtils/cursorFunctions";
import { BlockPlusAndSubNodes, ListGroupAndItem } from "@ext/markdown/logic/insertableNodeGroups";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";

const TableMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "table" });

	return (
		<ToolbarToggleButton
			active={isActive}
			disabled={isActive ? true : disabled}
			onClick={() => {
				if (!readyToPlace(editor.state, "table", [...BlockPlusAndSubNodes, ...ListGroupAndItem])) return false;

				editor
					.chain()
					.insertTable({ rows: 3, cols: 3, withHeaderRow: false })
					.focus(editor.state.selection.anchor + 3)
					.run();
			}}
			tooltipText={t("editor.table.name")}
		>
			<ToolbarIcon icon="table" />
		</ToolbarToggleButton>
	);
};

export default TableMenuButton;
