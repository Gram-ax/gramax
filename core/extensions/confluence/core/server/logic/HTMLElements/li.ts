import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const li: HTMLNodeConverter = () => {
	return {
		type: "listItem",
	};
};

export default li;
