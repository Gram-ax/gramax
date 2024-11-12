import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const ViewMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().setView({ defs: [] }).run()}
			icon={"panels-top-left"}
			tooltipText={t("properties.view.name")}
			nodeValues={{ action: "view" }}
		/>
	);
};

export default ViewMenuButton;
