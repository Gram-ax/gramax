import { Node } from "prosemirror-model";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";

const deleteDrawio = async (nodes: Node[], resourceService: ResourceServiceType) => {
	for (const node of nodes) {
		if (node.type.name !== "drawio") continue;
		await resourceService.deleteResource(node.attrs.src);
	}
};

export default deleteDrawio;
