import type { ResourceServiceType } from "@core-ui/ContextServices/ResourceService/ResourceService";
import type { Node } from "prosemirror-model";

const deleteDiagrams = async (nodes: Node[], resourceService: ResourceServiceType) => {
	for (const node of nodes) {
		if (node.type.name !== "diagrams") continue;
		await resourceService.deleteResource(node.attrs.src);
	}
};

export default deleteDiagrams;
