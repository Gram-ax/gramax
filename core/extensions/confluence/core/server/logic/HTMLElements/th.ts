import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const th: HTMLNodeConverter = (thNode) => {
	return {
		type: "tableHeader",
		attrs: {
			colspan: thNode?.getAttribute("colspan") ?? "1",
			rowspan: thNode?.getAttribute("rowspan") ?? "1",
			colwidth: thNode?.getAttribute("colwidth"),
		},
	};
};

export default th;
