import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import { Node } from "prosemirror-model";

const deleteOpenApi = async (nodes: Node[], apiUrlCreator: ApiUrlCreator) => {
	for (const node of nodes) {
		if (node.type.name !== OPEN_API_NAME) return;
		await FetchService.fetch(apiUrlCreator.deleteArticleResource(node.attrs.src));
	}
};

export default deleteOpenApi;
