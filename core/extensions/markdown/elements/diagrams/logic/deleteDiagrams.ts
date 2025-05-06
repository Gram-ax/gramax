import { Node } from "prosemirror-model";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";

const deleteDiagrams = async (nodes: Node[], resourceService: ResourceServiceType) => {
	for (const node of nodes) {
		if (node.type.name !== "diagrams") continue;
		await resourceService.deleteResource(node.attrs.src);
	}
};

export default deleteDiagrams;
