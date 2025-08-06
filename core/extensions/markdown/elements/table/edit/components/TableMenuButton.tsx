import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { BlockPlusAndSubNodes, ListGroupAndItem } from "@ext/markdown/logic/insertableNodeGroups";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { readyToPlace } from "@ext/markdown/elementsUtils/cursorFunctions";
import { Editor } from "@tiptap/core";

const TableMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "table" });

	return (
		<Button
			icon={"table"}
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
			isActive={isActive}
		/>
	);
};

export default TableMenuButton;
