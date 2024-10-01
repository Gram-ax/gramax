import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const blockquote: HTMLNodeConverter = () => {
	return {
		type: "note",
		attrs: { title: "", type: "quote", collapsed: false },
	};
};

export default blockquote;
