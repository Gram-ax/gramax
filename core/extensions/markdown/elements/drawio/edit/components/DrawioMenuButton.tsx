import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { setEditorStore } from "@core-ui/stores/EditorStore";
import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import { Icon } from "@ui-kit/Icon";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";
import { useCallback } from "react";
import createDrawio from "../logic/createDrawio";

interface DrawioMenuButtonProps {
	editor: Editor;
	fileName?: string;
}

const DrawioMenuButton = ({ editor, fileName }: DrawioMenuButtonProps) => {
	const articleProps = ArticlePropsService.value;
	const resourceService = ResourceService.value;
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "drawio" });

	const onSelect = useCallback(() => {
		setEditorStore({ lastUsedDiagramType: "drawio" });
		void createDrawio(editor, fileName || articleProps?.fileName, resourceService);
	}, [editor, fileName, articleProps, resourceService]);

	return (
		<ToolbarDropdownMenuItem active={isActive} disabled={disabled} onSelect={onSelect}>
			<div className="flex flex-row items-center gap-2 mr-3" data-qa="qa-edit-menu-diagrams.net">
				<Icon icon="drawio" />
				{t("diagram.names.drawio")}
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default DrawioMenuButton;
