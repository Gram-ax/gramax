import { getAggregatedValue } from "@ext/markdown/elements/table/edit/logic/aggregation";
import { getSaved } from "@ext/markdown/elements/table/edit/logic/sortAndFilter/sortFilterUtils";
import getTableData from "@ext/markdown/elements/table/edit/logic/tableData/getTableData";

import type { Node } from "@tiptap/pm/model";
import testData from "./data.json";

type NodeAsJson = Node & {
	content: Node["content"] & { length: number };
	childCount: Node["childCount"];
	firstChild: Node["childCount"];
	textContent: Node["textContent"];
	type: Node["type"] | string;
} & {
	getTextContent: () => string;
};

describe("table data, sort/filter and aggregation", () => {
	const prepareMockTableNode = (node: Node) => {
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

	test("returns table layout data for merged cells", () => {
		const { input, output } = testData.getTableData;
		const inputNode = input as never as Node;

		prepareMockTableNode(inputNode);

		const result = getTableData(inputNode);
		expect(result).toEqual(output);
	});

	test("returns aggregation data collected from body rows", () => {
		const { input, output } = testData.getTableDataWithAggregation;
		const inputNode = input as never as Node;

		prepareMockTableNode(inputNode);

		const result = getTableData(inputNode);
		expect(result).toEqual(output.tableData);

		if (!result?.aggregation?.enabled) throw new Error("Expected aggregation to be enabled");

		const aggregatedValues = result.aggregation.cells.map((cell) =>
			cell.method ? getAggregatedValue(cell.method, cell.data) : null,
		);
		expect(aggregatedValues).toEqual(output.aggregatedValues);
	});

	test("returns saved filter, sort and sorting order", () => {
		const { input, output } = testData.getSaved;
		const inputNode = input as never as Node;

		prepareMockTableNode(inputNode);

		const result = getSaved(inputNode);
		expect(result).toEqual(output);
	});
});
