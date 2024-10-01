import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const MAX_WIDTH = 780;

const getWidthFromParams = (columnNode: HTMLElement): number => {
	const widthParam = columnNode.querySelector('ac\\:parameter[ac\\:name="width"]');
	if (widthParam) {
		const widthValue = widthParam.textContent?.trim();

		if (widthValue?.endsWith("%")) {
			const percentage = parseFloat(widthValue);
			return (MAX_WIDTH * percentage) / 100;
		} else if (widthValue?.endsWith("px")) {
			return parseFloat(widthValue);
		}
	}
};

const column: HTMLNodeConverter = (columnNode) => {
	const width = getWidthFromParams(columnNode);

	return {
		type: "tableCell",
		attrs: {
			colspan: 1,
			rowspan: 1,
			colwidth: width,
		},
	};
};

export default column;
