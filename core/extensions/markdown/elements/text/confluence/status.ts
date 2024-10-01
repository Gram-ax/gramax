import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const status: NodeConverter = (statusNode) => {
	return {
		type: "text",
		marks: [
			{
				type: "code",
			},
		],
		text: statusNode?.attrs?.text?.toUpperCase(),
	};
};

export default status;
