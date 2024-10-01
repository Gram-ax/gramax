import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const p: HTMLNodeConverter = () => {
	return {
		type: "paragraph",
	};
};

export default p;
