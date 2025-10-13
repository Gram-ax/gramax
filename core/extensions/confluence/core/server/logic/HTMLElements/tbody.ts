import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const tableHeaderTypesMap = {
	row: "column",
	column: "row",
};

const tbody: HTMLNodeConverter = (tbodyNode) => {
	const firstTh = tbodyNode.querySelector("th");

	if (!firstTh)
		return {
			type: "table",
			attrs: {
				header: "none",
			},
		};

	const headerType = firstTh.getAttribute("scope");
	const header = tableHeaderTypesMap[headerType] || "none";

	return {
		type: "table",
		attrs: {
			header,
		},
	};
};

export default tbody;
