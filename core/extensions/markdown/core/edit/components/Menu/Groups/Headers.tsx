import ButtonsLayout from "@components/Layouts/ButtonLayout";
import HeadingMenuButton from "@ext/markdown/elements/heading/edit/components/HeadingMenuButton";
import { Editor } from "@tiptap/core";

const HeadersMenuGroup = ({ editor }: { editor?: Editor }) => {
	return (
		<ButtonsLayout>
			<HeadingMenuButton editor={editor} level={2} />
			<HeadingMenuButton editor={editor} level={3} />
			<HeadingMenuButton editor={editor} level={4} />
		</ButtonsLayout>
	);
};

export default HeadersMenuGroup;
