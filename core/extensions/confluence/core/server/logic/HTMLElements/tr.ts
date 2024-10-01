import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const tr: HTMLNodeConverter = () => {
	return {
		type: "tableRow",
	};
};

export default tr;
