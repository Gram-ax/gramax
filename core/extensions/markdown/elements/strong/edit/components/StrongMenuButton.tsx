import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const StrongMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleStrong().run()}
			icon={"bold"}
			tooltipText={t("editor.bold")}
			hotKey={"Mod-B"}
			nodeValues={{ mark: "strong" }}
		/>
	);
};

export default StrongMenuButton;
