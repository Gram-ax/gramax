import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const body: HTMLNodeConverter = () => {
	return {
		type: "doc",
	};
};

export default body;
