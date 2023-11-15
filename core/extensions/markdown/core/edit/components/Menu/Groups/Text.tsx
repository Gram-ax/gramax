import ButtonsLayout from "@components/Layouts/ButtonLayout";
import EmMenuButton from "@ext/markdown/elements/em/edit/components/EmMenuButton";
import StrongMenuButton from "@ext/markdown/elements/strong/edit/components/StrongMenuButton";
import { Editor } from "@tiptap/core";

const TextMenuGroup = ({ editor }: { editor?: Editor }) => {
	return (
		<ButtonsLayout>
			<EmMenuButton editor={editor} />
			<StrongMenuButton editor={editor} />
		</ButtonsLayout>
	);
};

export default TextMenuGroup;
