import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const status: HTMLNodeConverter = (statusNode) => {
	return {
		type: "text",
		text: statusNode.textContent,
		marks: [
			{
				type: "code",
			},
		],
	};
};

export default status;
