import type { ResourceServiceType } from "@core-ui/ContextServices/ResourceService/ResourceService";
import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import type { Node } from "prosemirror-model";

const deleteOpenApi = async (nodes: Node[], resourceService: ResourceServiceType) => {
	for (const node of nodes) {
		if (node.type.name !== OPEN_API_NAME) continue;
		await resourceService.deleteResource(node.attrs.src);
	}
};

export default deleteOpenApi;
