import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const ol: HTMLNodeConverter = () => {
	return {
		type: "orderedList",
	};
};

export default ol;
