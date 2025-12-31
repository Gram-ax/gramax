import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { Icon } from "@ui-kit/Icon";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";

const ViewMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "view" });
	return (
		<ToolbarDropdownMenuItem
			onClick={() => editor.chain().focus().setView({ defs: [] }).run()}
			active={isActive}
			disabled={disabled}
		>
			<div className="flex items-center gap-2">
				<Icon icon="panels-top-left" />
				{t("properties.view.name")}
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default ViewMenuButton;
