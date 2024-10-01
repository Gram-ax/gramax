import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const note: HTMLNodeConverter = (noteNode) => {
	const nameAttribute = noteNode.getAttribute("ac:name");
	const isCollapsed = nameAttribute === "expand";
	const title = noteNode.querySelector('ac\\:parameter[ac\\:name="title"]')?.textContent;

	const noteTypeMapping: { [key: string]: string } = {
		info: "info",
		tip: "tip",
		note: "note",
		warning: "danger",
	};

	const type = noteTypeMapping[nameAttribute] || "info";
	return {
		type: "note",
		attrs: { title: title, type: type, collapsed: isCollapsed },
	};
};

export default note;
