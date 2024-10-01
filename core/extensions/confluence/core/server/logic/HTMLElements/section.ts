import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const section: HTMLNodeConverter = () => {
	return {
		type: "table",
		content: [
			{
				type: "tableRow",
			},
		],
	};
};

export default section;
