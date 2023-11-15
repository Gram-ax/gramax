import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";
import { Editor } from "@tiptap/core";

const LinkMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() =>
				editor.commands.toggleLink({ href: "", target: editor ? getSelectedText(editor.state) : "" })
			}
			icon={"link"}
			nodeValues={{ mark: "link" }}
			tooltipText={"Ссылка"}
			hotKey={"Mod-K"}
		/>
	);
};

export default LinkMenuButton;
