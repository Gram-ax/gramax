import convertUnsupportedNode from "@ext/confluence/core/cloud/logic/convertUnsupportedNode";
import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const widget: NodeConverter = (widgetNode, ctx) => {
	const url = widgetNode.attrs?.parameters?.macroParams?.url?.value;
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
	return convertUnsupportedNode(widgetNode, ctx.confluencePageUrl);
};

export default widget;
