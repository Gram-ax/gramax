import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const date: NodeConverter = (dateNode) => {
	return {
		type: "text",
		text: new Date(Number(dateNode.attrs.timestamp)).toLocaleDateString(),
	};
};

export default date;
