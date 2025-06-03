import { Editor } from "@tiptap/core";
import initDrawioDiagram from "./initDrawioDiagram";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import getNaturalSize from "@ext/markdown/elements/diagrams/logic/getNaturalSize";

const createDrawio = async (
	editor: Editor,
	fileName: string,
	resourceService: ResourceServiceType,
	diagramContent?: string,
) => {
	const content = diagramContent ?? initDrawioDiagram;
	const name = `${fileName}.svg`;
	const newName = await resourceService.setResource(name, content);
	if (!newName) return;

	const newSize = getNaturalSize(content);
	const attributes: { src: string; width?: string; height?: string } = { src: newName };
	if (newSize) {
		attributes.width = newSize.width + "px";
		attributes.height = newSize.height + "px";
	}

	editor.chain().setDrawio(attributes).run();
};

export default createDrawio;
