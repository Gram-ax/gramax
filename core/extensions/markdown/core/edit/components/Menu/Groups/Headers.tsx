import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import HeadingMenuButton from "@ext/markdown/elements/heading/edit/components/HeadingMenuButton";
import { Editor } from "@tiptap/core";
import { ToolbarToggleGroup } from "@ui-kit/Toolbar";

const HeadersMenuGroup = ({ editor }: { editor?: Editor }) => {
	const { disabled: disabled, isActive: isActive } = ButtonStateService.useCurrentAction({
		action: "heading",
	});
	const activeLevel = (isActive ? editor.getAttributes("heading")?.level : 0)?.toString();

	return (
		<ToolbarToggleGroup defaultValue={activeLevel} disabled={disabled} type="single" value={activeLevel}>
			<HeadingMenuButton editor={editor} level={2} />
			<HeadingMenuButton editor={editor} level={3} />
			<HeadingMenuButton editor={editor} level={4} />
		</ToolbarToggleGroup>
	);
};

export default HeadersMenuGroup;
