import PageDataContext from "@core/Context/PageDataContext";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import getMermaidDiagram from "@ext/markdown/elements/diagrams/diagrams/mermaid/getMermaidDiagram";
import getPlantUmlDiagram from "@ext/markdown/elements/diagrams/diagrams/plantUml/getPlantUmlDiagram";
import getNaturalSize from "@ext/markdown/elements/diagrams/logic/getNaturalSize";
import { Editor } from "@tiptap/core";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import { startMermaid } from "../diagrams/mermaid/mermaidData";
import { startPlantUmlText } from "../diagrams/plantUml/plantUmlData";

const DIAGRAM_FUNCTIONS = {
	[DiagramType.mermaid]: getMermaidDiagram,
	[DiagramType["plant-uml"]]: getPlantUmlDiagram,
};

const createDiagrams = async (
	editor: Editor,
	fileName: string,
	resourceService: ResourceServiceType,
	diagramName: DiagramType,
	pageDataContext: PageDataContext,
) => {
	let file = "";
	let extension = "";
	switch (diagramName) {
		case DiagramType.mermaid:
			extension = "mermaid";
			file = startMermaid;
			break;
		case DiagramType["plant-uml"]:
			extension = "puml";
			file = startPlantUmlText;
			break;
	}

	const name = `${fileName}.${extension}`;
	const newName = await resourceService.setResource(name, file);

	if (!newName) return;

	const attributes: { src: string; diagramName: string; width?: string; height?: string } = {
		src: newName,
		diagramName,
	};
	try {
		const newSize = getNaturalSize(
			await DIAGRAM_FUNCTIONS?.[diagramName](file, pageDataContext.conf.diagramsServiceUrl),
		);

		if (newSize) {
			attributes.width = newSize.width + "px";
			attributes.height = newSize.height + "px";
		}
	} catch (error) {
		console.error("Error creating diagram:", error);
	}

	editor.chain().setDiagrams(attributes).run();
};

export default createDiagrams;
