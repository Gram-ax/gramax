import ConfluenceServerAPI from "@ext/confluence/core/api/ConfluenceServerAPI";
import convertHTMLUnsupportedNode from "@ext/confluence/core/server/logic/convertHTMLUnsupportedNode";
import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const user: HTMLNodeConverter = async (userNode, ctx) => {
	const userKey = userNode.querySelector("ri\\:user")?.getAttribute("ri:userkey");
	if (!userKey) return convertHTMLUnsupportedNode(userNode, ctx.confluencePageUrl);

	const user = await new ConfluenceServerAPI(ctx.data as ConfluenceServerSourceData).getUserById(userKey);
	if (!user) return convertHTMLUnsupportedNode(userNode, ctx.confluencePageUrl);

	return {
		type: "text",
		marks: [
			{
				attrs: {
					href: user.link,
					resourcePath: "",
					hash: "",
					isFile: false,
				},
				type: "link",
			},
		],
		text: user.name,
		content: [],
	};
};

export default user;
