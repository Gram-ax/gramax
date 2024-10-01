import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const time: HTMLNodeConverter = (timeNode) => {
	return {
		type: "text",
		text: new Date(timeNode.getAttribute("datetime"))?.toLocaleDateString(),
		content: [],
	};
};

export default time;
