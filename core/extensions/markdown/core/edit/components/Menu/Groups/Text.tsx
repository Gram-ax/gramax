import ButtonsLayout from "@components/Layouts/ButtonLayout";
import EmMenuButton from "@ext/markdown/elements/em/edit/components/EmMenuButton";
import StrikeMenuButton from "@ext/markdown/elements/strikethrough/edit/components/StrikeMenuButton";
import StrongMenuButton from "@ext/markdown/elements/strong/edit/components/StrongMenuButton";
import { Editor } from "@tiptap/core";

const TextMenuGroup = ({ editor }: { editor?: Editor }) => {
	return (
		<ButtonsLayout>
			<StrongMenuButton editor={editor} />
			<EmMenuButton editor={editor} />
			<StrikeMenuButton editor={editor} />
		</ButtonsLayout>
	);
};

export default TextMenuGroup;
