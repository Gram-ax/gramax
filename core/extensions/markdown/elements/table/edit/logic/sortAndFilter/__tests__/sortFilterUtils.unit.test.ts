import { getSaved, getTableData } from "@ext/markdown/elements/table/edit/logic/sortAndFilter/sortFilterUtils";
import type { Node } from "@tiptap/pm/model";
import data from "./data.json";

type NodeAsJson = Node & {
	content: Node["content"] & { length: number };
	childCount: Node["childCount"];
	firstChild: Node["childCount"];
	textContent: Node["textContent"];
	type: Node["type"] | string;
} & {
	getTextContent: () => string;
};

describe("test sortFilterUtils", () => {
	const prepareNode = (node: Node) => {
		const setParams = (node: NodeAsJson) => {
			node.childCount = node.content?.length;
			node.child = (i: number) => node.content[i];
			if (node.childCount) node.firstChild = node.content[0];
			node.forEach = (callback: (node: Node, offset: number, index: number) => void) => {
				for (let i = 0; i < node.childCount; i++) {
					const child = node.child(i);
					callback(child, undefined, i);
				}
			};

			node.getTextContent = () => {
				if (!node.content || node.content.length === 0) {
					return "";
				}

				let text = "";
				node.forEach((child: NodeAsJson) => {
					if (child.isText || child.type === "text") {
						text += child.text || "";
					} else if (child.textContent !== undefined) {
						text += child.textContent;
					} else if (child.getTextContent !== undefined) {
						text += child.getTextContent();
					}
				});
				return text;
			};
			node.forEach(setParams);
		};
		const setTextContent = (node: NodeAsJson) => {
			node.textContent = node.getTextContent();
			node.forEach(setTextContent);
		};
		setParams(node as NodeAsJson);
		setTextContent(node as NodeAsJson);
	};

	test("getTableData", () => {
		const { input, output } = data.getTableData;
		const inputNode = input as never as Node;

		prepareNode(inputNode);

		const result = getTableData(inputNode);
		expect(result).toEqual(output);
	});

	test("getSaved", () => {
		const { input, output } = data.getSaved;
		const inputNode = input as never as Node;

		prepareNode(inputNode);

		const result = getSaved(inputNode);
		expect(result).toEqual(output);
	});
});
