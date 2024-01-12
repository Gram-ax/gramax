import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import DiagramType from "@core/components/Diagram/DiagramType";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import SvgContainer from "@ext/markdown/core/edit/components/Menu/SvgContainer";
import { Editor } from "@tiptap/core";
import { c4DiagramIcon, c4DiagramTooltipText } from "../../diagrams/c4Diagram/c4DiagramData";
import { mermaidIcon, mermaidTooltipText } from "../../diagrams/mermaid/mermaidData";
import { plantUmlIcon, plantUmlTooltipText } from "../../diagrams/plantUml/plantUmlData";
import { tsDiagramIcon, tsDiagramTooltipText } from "../../diagrams/tsDiagram/tsDiagramData";
import createDiagrams from "../../logic/createDiagrams";

const DiagramsMenuButton = ({ editor, diagramName }: { editor: Editor; diagramName: DiagramType }) => {
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	let diagramIcon: JSX.Element;
	let diagramTooltipText: string;
	switch (diagramName) {
		case DiagramType.mermaid:
			diagramIcon = mermaidIcon;
			diagramTooltipText = mermaidTooltipText;
			break;
		case DiagramType["c4-diagram"]:
			diagramIcon = c4DiagramIcon;
			diagramTooltipText = c4DiagramTooltipText;
			break;
		case DiagramType["plant-uml"]:
			diagramIcon = plantUmlIcon;
			diagramTooltipText = plantUmlTooltipText;
			break;
		case DiagramType["ts-diagram"]:
			diagramIcon = tsDiagramIcon;
			diagramTooltipText = tsDiagramTooltipText;
			break;
	}

	return (
		<Button
			dataQa={`qa-edit-menu-${diagramName}`}
			tooltipText={diagramTooltipText}
			nodeValues={{ action: diagramName as any }}
			onClick={() => void createDiagrams(editor, articleProps, apiUrlCreator, diagramName)}
		>
			<SvgContainer>{diagramIcon}</SvgContainer>
		</Button>
	);
};

export default DiagramsMenuButton;
