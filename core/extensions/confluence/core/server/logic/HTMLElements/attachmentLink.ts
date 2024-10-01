import ConfluenceServerAPI from "@ext/confluence/core/api/ConfluenceServerAPI";
import convertHTMLUnsupportedNode from "@ext/confluence/core/server/logic/convertHTMLUnsupportedNode";
import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const attachmentLink: HTMLNodeConverter = async (attachmentNode, ctx) => {
	const page = attachmentNode.querySelector("ri\\:page");
	const title = page?.getAttribute("ri:content-title") || ctx.confluencePageUrl.split("/").pop();

	const fileName = attachmentNode?.querySelector("ri\\:attachment")?.getAttribute("ri:filename");

	const pageData = await new ConfluenceServerAPI(ctx.data as ConfluenceServerSourceData).getPageData(title);

	if (!pageData || !fileName) return convertHTMLUnsupportedNode(attachmentNode, ctx.confluencePageUrl);

	const attachmentData = await new ConfluenceServerAPI(ctx.data as ConfluenceServerSourceData).getAttachmentData(
		fileName,
		pageData.id,
	);

	if (!attachmentData) return convertHTMLUnsupportedNode(attachmentNode, ctx.confluencePageUrl);

	const link = ctx.data.domain + attachmentData.webui;
	return {
		type: "text",
		marks: [
			{
				type: "link",
				attrs: {
					href: link,
					resourcePath: "",
					hash: "",
					isFile: false,
				},
			},
		],
		text: fileName,
		content: [],
	};
};

export default attachmentLink;
