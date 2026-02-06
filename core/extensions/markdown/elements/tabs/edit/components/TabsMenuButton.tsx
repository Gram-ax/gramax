import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { Icon } from "@ui-kit/Icon";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";

const TabsMenuButton = ({ editor }: { editor: Editor }) => {
	const tabs = ButtonStateService.useCurrentAction({ action: "tabs" });

	return (
		<ToolbarDropdownMenuItem
			active={tabs.isActive}
			disabled={tabs.disabled}
			onClick={() => editor.chain().focus().setTabs().run()}
		>
			<div className="flex items-center gap-2 w-full">
				<Icon icon="app-window" />
				{t("editor.tabs.name")}
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default TabsMenuButton;
