import DiagramType from "../../../../../../logic/components/Diagram/DiagramType";
import NodeTransformerFunc from "../../../../core/edit/logic/Prosemirror/NodeTransformerFunc";
import getDiagramDataByLang from "../getDiagramDataByLang";
import isDiagramName from "../isDiagramName";

const diagramsNodeTransformer: NodeTransformerFunc = (node) => {
	if (node?.type === "code_block" && isDiagramName(node?.attrs?.language)) {
		const { name, title } = getDiagramDataByLang(node?.attrs?.language);
		node = {
			type: "diagrams",
			attrs: { content: node.content[0].text, diagramName: DiagramType[name], title },
		};
		return { isSet: true, value: node };
	}
	if (isDiagramName(node?.type)) {
		node = {
			type: "diagrams",
			attrs: {
				src: node.attrs.src,
				title: node.attrs.title,
				diagramName: DiagramType[node.type],
				width: node.attrs.width,
				height: node.attrs.height,
			},
		};
		return { isSet: true, value: node };
	}

	return null;
};

export default diagramsNodeTransformer;
