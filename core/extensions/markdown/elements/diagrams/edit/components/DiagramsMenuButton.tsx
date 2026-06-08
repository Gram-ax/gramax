import DiagramType from "@core/components/Diagram/DiagramType";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { setEditorStore } from "@core-ui/stores/EditorStore";
import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import { Icon } from "@ui-kit/Icon";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";
import { useCallback } from "react";
import createDiagrams from "../../logic/createDiagrams";

interface DiagramsMenuButtonProps {
	editor: Editor;
	diagramName: DiagramType;
	fileName?: string;
}

const DiagramsMenuButton = ({ editor, diagramName, fileName }: DiagramsMenuButtonProps) => {
	const resourceService = ResourceService.value;
	const pageDataContext = PageDataContextService.value;
	const articleProps = ArticlePropsService.value;
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "diagrams", attrs: { diagramName } });

	const onSelect = useCallback(() => {
		setEditorStore({ lastUsedDiagramType: diagramName === DiagramType.mermaid ? "mermaid" : "plant-uml" });
		void createDiagrams(editor, fileName || articleProps?.fileName, resourceService, diagramName, pageDataContext);
	}, [editor, fileName, articleProps, resourceService, diagramName, pageDataContext]);

	return (
		<ToolbarDropdownMenuItem active={isActive} disabled={disabled} onSelect={onSelect}>
			<div className="flex flex-row items-center gap-2" data-qa={`qa-edit-menu-${diagramName}`}>
				<Icon icon={diagramName === DiagramType.mermaid ? "mermaid" : "plant-uml"} />
				{diagramName === DiagramType.mermaid ? t("diagram.names.mermaid") : t("diagram.names.puml")}
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default DiagramsMenuButton;
