import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const li: HTMLNodeConverter = () => {
	return {
		type: "list_item",
	};
};

export default li;
