import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import DiagramType from "@core/components/Diagram/DiagramType";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { c4DiagramIcon } from "../../diagrams/c4Diagram/c4DiagramData";
import { mermaidIcon } from "../../diagrams/mermaid/mermaidData";
import { plantUmlIcon } from "../../diagrams/plantUml/plantUmlData";
import { tsDiagramIcon } from "../../diagrams/tsDiagram/tsDiagramData";
import createDiagrams from "../../logic/createDiagrams";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { useMemo } from "react";

interface DiagramsMenuButtonProps {
	editor: Editor;
	diagramName: DiagramType;
	fileName?: string;
}

const DiagramsMenuButton = ({ editor, diagramName, fileName }: DiagramsMenuButtonProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const resourceService = ResourceService.value;
	const pageDataContext = PageDataContextService.value;
	const articleProps = ArticlePropsService.value;
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "diagrams", attrs: { diagramName } });

	const { text, diagramIcon } = useMemo(() => {
		let text: string;
		let diagramIcon: JSX.Element;

		switch (diagramName) {
			case DiagramType.mermaid:
				diagramIcon = mermaidIcon;
				text = t("diagram.names.mermaid");
				break;
			case DiagramType["c4-diagram"]:
				diagramIcon = c4DiagramIcon;
				text = t("diagram.names.c4");
				break;
			case DiagramType["plant-uml"]:
				diagramIcon = plantUmlIcon;
				text = t("diagram.names.puml");
				break;
			case DiagramType["ts-diagram"]:
				diagramIcon = tsDiagramIcon;
				text = t("diagram.names.ts");
				break;
		}

		return { text, diagramIcon };
	}, [diagramName]);

	return (
		<ToolbarDropdownMenuItem
			disabled={disabled}
			active={isActive}
			onSelect={() =>
				void createDiagrams(
					editor,
					fileName || articleProps?.fileName,
					apiUrlCreator,
					resourceService,
					diagramName,
					pageDataContext,
				)
			}
		>
			<div className="flex flex-row items-center gap-2" data-qa={`qa-edit-menu-${diagramName}`}>
				{diagramIcon}
				{text}
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default DiagramsMenuButton;
