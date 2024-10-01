import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const ol: HTMLNodeConverter = () => {
	return {
		type: "ordered_list",
	};
};

export default ol;
