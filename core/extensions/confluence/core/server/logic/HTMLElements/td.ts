import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const td: HTMLNodeConverter = (tdNode) => {
	return {
		type: "tableCell",
		attrs: {
			colspan: tdNode?.getAttribute("colspan") ?? "1",
			rowspan: tdNode?.getAttribute("rowspan") ?? "1",
			colwidth: tdNode?.getAttribute("colwidth"),
		},
	};
};

export default td;
