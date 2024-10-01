import ConfluenceAPI from "@ext/confluence/core/api/model/ConfluenceAPI";
import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";
import convertUnsupportedNode from "@ext/confluence/core/cloud/logic/convertUnsupportedNode";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";

const viewFile: NodeConverter = async (viewFileNode, ctx) => {
	const fileName = viewFileNode?.attrs?.parameters?.macroParams?.name?.value;
	const api = makeSourceApi(ctx.data) as ConfluenceAPI;

	const attachment = await api.getAttachmentData(fileName);
	if (!attachment) return convertUnsupportedNode(viewFileNode, ctx.confluencePageUrl);
	const lastAttachment = attachment.reverse()[0];
	const articleId = lastAttachment?.pageId || lastAttachment?.blogPostId;

	const resourceName = await ctx.save(lastAttachment.fileId, articleId, true);
	if (!resourceName) return convertUnsupportedNode(viewFileNode, ctx.confluencePageUrl);

	return {
		type: "paragraph",
		content: [
			{
				type: "text",
				marks: [
					{
						type: "file",
						attrs: {
							href: "",
							resourcePath: resourceName.newName,
							hash: "",
							isFile: true,
						},
					},
				],
				text: resourceName.title + " ",
			},
		],
	};
};

export default viewFile;
