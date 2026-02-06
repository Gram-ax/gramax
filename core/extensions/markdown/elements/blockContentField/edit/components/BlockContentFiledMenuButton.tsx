import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { editName as blockFieldEditName } from "@ext/markdown/elements/blockContentField/consts";
import { Editor } from "@tiptap/core";

const BlockContentFieldMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			icon="rectangle-ellipsis"
			nodeValues={{ action: blockFieldEditName }}
			onClick={() => editor.chain().focus().setBlockField().run()}
			tooltipText={t("editor.templates.block-field")}
		/>
	);
};

export default BlockContentFieldMenuButton;
