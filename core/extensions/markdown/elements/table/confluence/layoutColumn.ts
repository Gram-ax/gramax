import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const CONFLUENCE_LAYOUT_SCALE = 7.8;

const layoutColumn: NodeConverter = (layoutColumnNode) => {
	return {
		type: "tableCell",
		attrs: {
			colspan: 1,
			rowspan: 1,
			colwidth: Math.floor(layoutColumnNode.attrs.width * CONFLUENCE_LAYOUT_SCALE),
		},
		content: layoutColumnNode.content,
	};
};

export default layoutColumn;
