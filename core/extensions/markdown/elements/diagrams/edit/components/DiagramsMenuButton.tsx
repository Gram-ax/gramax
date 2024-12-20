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
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";

const DiagramsMenuButton = ({ editor, diagramName }: { editor: Editor; diagramName: DiagramType }) => {
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const onLoadResource = OnLoadResourceService.value;
	const pageDataContext = PageDataContextService.value;

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
				void createDiagrams(editor, articleProps, apiUrlCreator, onLoadResource, diagramName, pageDataContext)
			}
		>
			<SvgContainer>{diagramIcon}</SvgContainer>
		</Button>
	);
};

export default DiagramsMenuButton;
