import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const a: HTMLNodeConverter = (aNode) => {
	return {
		type: "text",
		marks: [
			{
				attrs: {
					href: aNode.getAttribute("href"),
					resourcePath: "",
					hash: "",
					isFile: false,
				},
				type: "link",
			},
		],
		text: aNode.textContent,
	};
};

export default a;
