import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const hr: HTMLNodeConverter = () => {
	return {
		type: "horizontal_rule",
	};
};

export default hr;
