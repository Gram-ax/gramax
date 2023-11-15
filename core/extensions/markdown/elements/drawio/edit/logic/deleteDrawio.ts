import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { Node } from "prosemirror-model";

const deleteDrawio = async (nodes: Node[], apiUrlCreator: ApiUrlCreator) => {
	for (const node of nodes) {
		if (node.type.name !== "drawio") return;
		await FetchService.fetch(apiUrlCreator.deleteArticleResource(node.attrs.src));
	}
};

export default deleteDrawio;
