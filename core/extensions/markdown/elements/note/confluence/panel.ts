import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const panel: NodeConverter = (panelNode) => {
	panelNode.type = "note";

	const panelTypeMapping: { [key: string]: string } = {
		info: "info",
		error: "danger",
		note: "tip",
		warning: "note",
		success: "lab",
	};

	const type = panelTypeMapping[panelNode.attrs.panelType] || "info";

	panelNode.attrs = {
		type: type,
		title: "",
	};

	return panelNode;
};

export default panel;
