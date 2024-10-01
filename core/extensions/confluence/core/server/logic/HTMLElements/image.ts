import ConfluenceServerAPI from "@ext/confluence/core/api/ConfluenceServerAPI";
import convertHTMLUnsupportedNode from "@ext/confluence/core/server/logic/convertHTMLUnsupportedNode";
import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";
import t from "@ext/localization/locale/translate";

const image: HTMLNodeConverter = async (imageNode, ctx) => {
	const title = imageNode?.getAttribute("ac:title");
	const pageTitle = imageNode.querySelector("ri\\:page")?.getAttribute("ri:content-title");
	const fileName = imageNode?.querySelector("ri\\:attachment")?.getAttribute("ri:filename");
	if (!fileName) {
		console.error(`${t("confluence.error.couldnt-find-file")} ${imageNode?.outerHTML}`);
		return convertHTMLUnsupportedNode(imageNode, ctx.confluencePageUrl);
	}
	const pageData = pageTitle
		? await new ConfluenceServerAPI(ctx.data as ConfluenceServerSourceData).getPageData(pageTitle)
		: null;

	const resourceName = await ctx.save(fileName, pageData?.id);
	if (!resourceName) return convertHTMLUnsupportedNode(imageNode, ctx.confluencePageUrl);
	return {
		type: "image",
		attrs: {
			src: resourceName.newName,
			title: title,
		},
		objects: [],
	};
};

export default image;
