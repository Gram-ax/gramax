import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const syncBlock: NotionNodeConverter = (syncBlockNode, ctx) => {
	if (!syncBlockNode?.[syncBlockNode.type].synced_from) return { type: "paragraph", content: syncBlockNode.content };
	
	return ctx.convertUnsupported(syncBlockNode);
};

export default syncBlock;
