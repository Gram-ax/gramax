import t from "@ext/localization/locale/translate";
import { editName as blockFieldEditName } from "@ext/markdown/elements/blockContentField/consts";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const BlockContentFieldMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().setBlockField().run()}
			icon="rectangle-ellipsis"
			tooltipText={t("editor.templates.block-field")}
			nodeValues={{ action: blockFieldEditName }}
		/>
	);
};

export default BlockContentFieldMenuButton;
