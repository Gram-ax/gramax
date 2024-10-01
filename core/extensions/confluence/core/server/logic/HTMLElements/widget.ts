import convertHTMLUnsupportedNode from "@ext/confluence/core/server/logic/convertHTMLUnsupportedNode";
import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const widget: HTMLNodeConverter = (widgetNode, ctx) => {
	const url = widgetNode.querySelector("ri\\:url")?.getAttribute("ri:value");
	if (url) {
		return {
			type: "video",
			attrs: {
				title: "",
				path: url,
				isLink: true,
			},
		};
	}
	return convertHTMLUnsupportedNode(widgetNode, ctx.confluencePageUrl);
};

export default widget;
