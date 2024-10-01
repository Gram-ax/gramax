import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const richTextBody: HTMLNodeConverter = (rtbNode) => {
	const parentNode = rtbNode.closest("ac\\:structured-macro")?.getAttribute("ac:name");
	if (parentNode === "section") {
		return {
			type: "tableRow",
		};
	}

	const rtbAsTextParents = ["panel", "column", "info", "tip", "note", "warning", "expand", "excerpt"];

	if (rtbAsTextParents.includes(parentNode)) {
		return {
			type: "paragraph",
		};
	}
	return null;
};

export default richTextBody;
