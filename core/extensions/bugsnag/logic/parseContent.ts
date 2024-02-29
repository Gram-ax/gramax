import { JSONContent } from "@tiptap/react";

const parseContent = (dom: JSONContent) => {
	const stack = [];
	dom.content.forEach((node) => stack.push(node));

	while (stack.length) {
		const node = stack.pop();
		if (node.attrs) node.attrs = null;

		if (node.marks) node.marks.forEach((mark) => stack.push(mark));

		if (node.type === "text") {
			node.text = "";
			continue;
		}

		if (node.content) node.content.forEach((node) => stack.push(node));
	}

	return dom;
};

export default parseContent;
