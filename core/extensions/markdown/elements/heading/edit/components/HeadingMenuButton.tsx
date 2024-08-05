import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Level } from "@ext/markdown/elements/heading/edit/model/heading";
import { Editor } from "@tiptap/core";

const HeadingMenuButton = ({ level, editor }: { level: Level; editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
			tooltipText={`${t("editor.heading")} ${level}`}
			hotKey={`Mod-Alt-${level}`}
			icon={`heading-${level}`}
			iconViewBox="3 3 20 20"
			nodeValues={{ action: "heading", attrs: { level } }}
		/>
	);
};

export default HeadingMenuButton;
