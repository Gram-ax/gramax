import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { useIsOneNodeSelected } from "@ext/markdown/core/edit/logic/hooks/useIsOneNodeSelected";
import getIsSelected from "@ext/markdown/elementsUtils/getIsSelected";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { memo, useCallback } from "react";

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
			active={isActiveCode}
			disabled={isDisabledCode}
			hotKey={isInline && "Mod-L"}
			onClick={toggleCode}
			tooltipText={isSelected ? t("editor.code") : t("editor.code-block")}
		>
			<ToolbarIcon icon={"code-xml"} />
		</ToolbarToggleButton>
	);
};

export default memo(CodeMenuButton);
