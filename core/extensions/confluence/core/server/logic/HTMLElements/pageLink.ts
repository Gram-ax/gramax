import ConfluenceServerAPI from "@ext/confluence/core/api/ConfluenceServerAPI";
import convertHTMLUnsupportedNode from "@ext/confluence/core/server/logic/convertHTMLUnsupportedNode";
import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const pageLink: HTMLNodeConverter = async (pageLinkNode, ctx) => {
	const page = pageLinkNode.querySelector("ri\\:page");
	const title = page?.getAttribute("ri:content-title");
	const pageData = await new ConfluenceServerAPI(ctx.data as ConfluenceServerSourceData).getPageData(title);
	if (!pageData?.link) return convertHTMLUnsupportedNode(pageLinkNode, ctx.confluencePageUrl);

	const link = ctx.data.domain + pageData.link;
	const plainTextBody = pageLinkNode.querySelector("ac\\:plain-text-link-body");
	const textContent = plainTextBody?.innerHTML.replace(/<!--|-->/g, "").replace(/\[CDATA\[|\]\]/g, "");

	return {
		type: "text",
		marks: [
			{
				attrs: {
					href: link,
					resourcePath: "",
					hash: "",
					isFile: false,
				},
				type: "link",
			},
		],
		text: textContent ? textContent : link,
		content: [],
	};
};

export default pageLink;
