import { Node } from "prosemirror-model";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";

const deleteImages = async (nodes: Node[], resourceService: ResourceServiceType) => {
	for (const node of nodes) {
		if (node.type.name !== "image" && node.type.name !== "inlineImage") continue;
		await resourceService.deleteResource(node.attrs.src);
	}
};

export default deleteImages;
