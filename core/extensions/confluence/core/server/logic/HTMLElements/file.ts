import ConfluenceServerAPI from "@ext/confluence/core/api/ConfluenceServerAPI";
import convertHTMLUnsupportedNode from "@ext/confluence/core/server/logic/convertHTMLUnsupportedNode";
import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";
import t from "@ext/localization/locale/translate";

const file: HTMLNodeConverter = async (fileNode, ctx) => {
	const fileName = fileNode?.querySelector("ri\\:attachment")?.getAttribute("ri:filename");
	const pageTitle = fileNode?.querySelector("ri\\:page")?.getAttribute("ri:content-title");
	if (!fileName) {
		console.error(`${t("confluence.error.couldnt-find-file")} ${fileNode?.outerHTML}`);
		return convertHTMLUnsupportedNode(fileNode, ctx.confluencePageUrl);
	}
	const pageData = pageTitle
		? await new ConfluenceServerAPI(ctx.data as ConfluenceServerSourceData).getPageData(pageTitle)
		: null;
		
	const resourceName = await ctx.save(fileName, pageData?.id);
	if (!resourceName) return convertHTMLUnsupportedNode(fileNode, ctx.confluencePageUrl);
	return {
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
	};
};

export default file;
