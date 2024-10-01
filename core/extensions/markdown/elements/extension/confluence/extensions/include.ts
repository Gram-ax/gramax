import ConfluenceAPI from "@ext/confluence/core/api/model/ConfluenceAPI";
import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";
import convertUnsupportedNode from "@ext/confluence/core/cloud/logic/convertUnsupportedNode";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { JSONContent } from "@tiptap/core";

const include: NodeConverter = async (includeNode, ctx) => {
	const value = includeNode?.attrs?.parameters?.macroParams[""]?.value;

	if (!value) {
		return convertUnsupportedNode(includeNode, ctx.confluencePageUrl);
	}

	const [key, pageName] = value.split(":");
	const api = makeSourceApi(ctx.data) as ConfluenceAPI;

	const spaces = await api.getSpaces();
	const matchingSpace = spaces.find((space) => space.key === key);

	if (!matchingSpace) {
		return convertUnsupportedNode(includeNode, ctx.confluencePageUrl);
	}

	const storageData: ConfluenceStorageData = {
		source: ctx.data,
		id: matchingSpace.id,
		name: matchingSpace.name,
	};

	const pages = await api.getArticles(storageData);
	const matchingPage = pages.find((page) => page.title === pageName);

	if (!matchingPage.body?.atlas_doc_format?.value) {
		return convertUnsupportedNode(includeNode, ctx.confluencePageUrl);
	}

	const pageJson = JSON.parse(matchingPage.body?.atlas_doc_format?.value) as JSONContent;

	return {
		type: "paragraph",
		content: pageJson.content,
	};
};

export default include;
