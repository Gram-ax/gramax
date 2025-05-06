import ButtonsLayout from "@components/Layouts/ButtonLayout";
import BlockContentFieldMenuButton from "@ext/markdown/elements/blockContentField/edit/components/BlockContentFiledMenuButton";
import InlinePropertyMenuButton from "@ext/markdown/elements/inlineProperty/edit/components/InlinePropertyMenuButton";
import { Editor } from "@tiptap/core";

const PropertyMenuGroup = ({ editor }: { editor?: Editor }) => {
	return (
		<ButtonsLayout>
			<InlinePropertyMenuButton editor={editor} />
			<BlockContentFieldMenuButton editor={editor} />
		</ButtonsLayout>
	);
};

export default PropertyMenuGroup;
