import { toHtml } from "hast-util-to-html";
import React from "react"; // for unit test

export interface CodeLine {
	key: string;
	html: string;
}

export const splitCodeIntoLines = (hastTree: any) => {
	const lines: CodeLine[] = [];
	let currentLineElements: any[] = [];
	let lineKey = 0;

	const processNode = (node: any) => {
		if (node.type === "text") {
			const text = node.value;
			const textLines = text.split("\n");

			textLines.forEach((lineText: string, index: number) => {
				if (index > 0) {
					if (currentLineElements.length > 0) {
						const lineHtml = toHtml({
							type: "element",
							tagName: "span",
							children: currentLineElements,
							properties: {},
						});
						lines.push({
							key: `line-${lineKey++}`,
							html: lineHtml,
						});
						currentLineElements = [];
					}
				}

				if (lineText) {
					currentLineElements.push({ type: "text", value: lineText });
				}
			});
		} else if (node.type === "element") {
			const element = { ...node };
			element.children = [];

			node.children?.forEach((child: any) => {
				if (child.type === "text") {
					const text = child.value;
					const textLines = text.split("\n");

					textLines.forEach((lineText: string, index: number) => {
						if (index > 0) {
							if (currentLineElements.length > 0) {
								element.children = [...currentLineElements];
								const lineHtml = toHtml(element);
								lines.push({
									key: `line-${lineKey++}`,
									html: lineHtml,
								});
								currentLineElements = [];
								element.children = [];
							}
						}

						if (lineText) {
							currentLineElements.push({ type: "text", value: lineText });
						}
					});
				} else {
					processNode(child);
				}
			});

			if (currentLineElements.length > 0) {
				element.children = [...currentLineElements];
				currentLineElements = [{ ...element }];
			}
		}
	};

	hastTree.children?.forEach(processNode);

	if (currentLineElements.length > 0) {
		const lineHtml = toHtml({ type: "element", tagName: "span", children: currentLineElements, properties: {} });
		lines.push({
			key: `line-${lineKey++}`,
			html: lineHtml,
		});
	}

	return lines.map((line, index) => (
		<>
			<span className="code-line" dangerouslySetInnerHTML={{ __html: line.html }} key={line.key} />
			{index < lines.length - 1 && "\n"}
		</>
	));
};
