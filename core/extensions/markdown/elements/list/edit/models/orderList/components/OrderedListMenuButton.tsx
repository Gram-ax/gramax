import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const OrderedListMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleOrderedList().run()}
			icon={"list-ol"}
			tooltipText={"Нумерованный список"}
			hotKey={"Mod-Shift-7"}
			nodeValues={{ action: "ordered_list" }}
		/>
	);
};

export default OrderedListMenuButton;
