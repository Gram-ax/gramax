import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import getIsSelected from "@ext/markdown/elementsUtils/getIsSelected";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { memo, useCallback } from "react";
import { useIsOneNodeSelected } from "@ext/markdown/core/edit/logic/hooks/useIsOneNodeSelected";

interface CodeMenuButtonProps {
	editor: Editor;
	isInline?: boolean;
}

const CodeMenuButton = ({ editor, isInline = false }: CodeMenuButtonProps) => {
	const isSelected = useIsOneNodeSelected(editor);
	const { disabled: isDisabledCode, isActive: isActiveCode } = ButtonStateService.useCurrentAction(
		isSelected ? { mark: "code" } : { action: "code_block" },
	);

	const toggleCode = useCallback(() => {
		if (isSelected) editor.chain().focus().toggleCode().run();
		else if (getIsSelected(editor.state)) editor.chain().focus().multilineCodeBlock().run();
		else editor.chain().focus().toggleCodeBlock().run();
	}, [isSelected, editor]);

	return (
		<ToolbarToggleButton
			onClick={toggleCode}
			tooltipText={isSelected ? t("editor.code") : t("editor.code-block")}
			hotKey={isInline && "Mod-L"}
			disabled={isDisabledCode}
			active={isActiveCode}
		>
			<ToolbarIcon icon={"code-xml"} />
		</ToolbarToggleButton>
	);
};

export default memo(CodeMenuButton);
