import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const InlinePropertyMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			icon="rectangle-ellipsis"
			nodeValues={{ action: "inline-property" }}
			onClick={() => editor.chain().focus().setInlineProperty().run()}
			tooltipText={t("editor.templates.inline-property")}
		/>
	);
};

export default InlinePropertyMenuButton;
