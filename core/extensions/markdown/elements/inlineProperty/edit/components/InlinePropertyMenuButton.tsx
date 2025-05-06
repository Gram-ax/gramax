import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const InlinePropertyMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().setInlineProperty().run()}
			icon="rectangle-ellipsis"
			tooltipText={t("editor.templates.inline-property")}
			nodeValues={{ action: "inline-property" }}
		/>
	);
};

export default InlinePropertyMenuButton;
