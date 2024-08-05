import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";
import { Editor } from "@tiptap/core";

const LinkMenuButton = ({ editor, onClick }: { editor: Editor; onClick: () => void }) => {
	const onClickHandler = () => {
		onClick();
		editor.commands.toggleLink({ href: "", target: editor ? getSelectedText(editor.state) : "" });
	};

	return (
		<Button
			onClick={onClickHandler}
			icon={"link"}
			nodeValues={{ mark: "link" }}
			tooltipText={t("link")}
			hotKey={"Mod-K"}
		/>
	);
};

export default LinkMenuButton;
