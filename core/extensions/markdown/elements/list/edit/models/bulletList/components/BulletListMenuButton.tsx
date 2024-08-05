import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const BulletListMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleBulletList().run()}
			icon={"list"}
			tooltipText={t("editor.bullet-list")}
			hotKey={"Mod-Shift-8"}
			nodeValues={{ action: "bullet_list" }}
		/>
	);
};

export default BulletListMenuButton;
