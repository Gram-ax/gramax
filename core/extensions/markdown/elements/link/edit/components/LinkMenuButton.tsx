import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";

const LinkMenuButton = ({ editor, onClick }: { editor: Editor; onClick: () => void }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ mark: "link" });
	const onClickHandler = () => {
		onClick();
		editor.commands.toggleLink({ href: "", target: editor ? getSelectedText(editor.state) : "" });
	};

	return (
		<ToolbarToggleButton
			tooltipText={t("link")}
			hotKey={"Mod-K"}
			disabled={disabled}
			active={isActive}
			onClick={() => onClickHandler()}
		>
			<ToolbarIcon icon={"link"} />
		</ToolbarToggleButton>
	);
};

export default LinkMenuButton;
