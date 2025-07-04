import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import DiagramType from "@core/components/Diagram/DiagramType";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import SvgContainer from "@ext/markdown/core/edit/components/Menu/SvgContainer";
import { Editor } from "@tiptap/core";
import { c4DiagramIcon } from "../../diagrams/c4Diagram/c4DiagramData";
import { mermaidIcon } from "../../diagrams/mermaid/mermaidData";
import { plantUmlIcon } from "../../diagrams/plantUml/plantUmlData";
import { tsDiagramIcon } from "../../diagrams/tsDiagram/tsDiagramData";
import createDiagrams from "../../logic/createDiagrams";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";

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

	let diagramIcon: JSX.Element;
	let diagramTooltipText: string;
	switch (diagramName) {
		case DiagramType.mermaid:
			diagramIcon = mermaidIcon;
			diagramTooltipText = t("diagram.names.mermaid");
			break;
		case DiagramType["c4-diagram"]:
			diagramIcon = c4DiagramIcon;
			diagramTooltipText = t("diagram.names.c4");
			break;
		case DiagramType["plant-uml"]:
			diagramIcon = plantUmlIcon;
			diagramTooltipText = t("diagram.names.puml");
			break;
		case DiagramType["ts-diagram"]:
			diagramIcon = tsDiagramIcon;
			diagramTooltipText = t("diagram.names.ts");
			break;
	}

	return (
		<Button
			dataQa={`qa-edit-menu-${diagramName}`}
			tooltipText={diagramTooltipText}
			nodeValues={{ action: "diagrams" }}
			onClick={() =>
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
			<SvgContainer>{diagramIcon}</SvgContainer>
		</Button>
	);
};

export default DiagramsMenuButton;
