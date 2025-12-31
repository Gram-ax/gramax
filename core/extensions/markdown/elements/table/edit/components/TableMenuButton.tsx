import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { BlockPlusAndSubNodes, ListGroupAndItem } from "@ext/markdown/logic/insertableNodeGroups";
import t from "@ext/localization/locale/translate";
import { readyToPlace } from "@ext/markdown/elementsUtils/cursorFunctions";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";

const TableMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "table" });

	return (
		<ToolbarToggleButton
			tooltipText={t("editor.table.name")}
			onClick={() => {
				if (!readyToPlace(editor.state, "table", [...BlockPlusAndSubNodes, ...ListGroupAndItem])) return false;

				editor
					.chain()
					.insertTable({ rows: 3, cols: 3, withHeaderRow: false })
					.focus(editor.state.selection.anchor + 3)
					.run();
			}}
			disabled={isActive ? true : disabled}
			active={isActive}
		>
			<ToolbarIcon icon="table" />
		</ToolbarToggleButton>
	);
};

export default TableMenuButton;
