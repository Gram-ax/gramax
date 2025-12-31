import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { Editor } from "@tiptap/core";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";

const HTMLMenuButton = ({ editor }: { editor: Editor }) => {
	const html = ButtonStateService.useCurrentAction({ action: "html" });

	return (
		<DropdownMenuItem
			disabled={html.disabled}
			onSelect={() => editor.chain().focus().setHTML({ content: "<p>HTML</p>" }).run()}
		>
			<div className="flex items-center gap-2">
				<Icon icon="file-code" />
				HTML
			</div>
		</DropdownMenuItem>
	);
};

export default HTMLMenuButton;
