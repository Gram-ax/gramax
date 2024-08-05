import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const OrderedListMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleOrderedList().run()}
			icon={"list-ordered"}
			tooltipText={t("editor.ordered-list")}
			hotKey={"Mod-Shift-7"}
			nodeValues={{ action: "ordered_list" }}
		/>
	);
};

export default OrderedListMenuButton;
