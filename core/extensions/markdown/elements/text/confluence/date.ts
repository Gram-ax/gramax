import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

const date: NodeConverter = (dateNode) => {
	return {
		type: "text",
		text: new Date(Number(dateNode.attrs.timestamp)).toLocaleDateString(),
	};
};

export default date;
