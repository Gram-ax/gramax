const LIST_TYPES = ["UL", "OL"];

const getPrefix = (node: Node, index: number = 0): string => {
	const dataset = (node as HTMLElement).dataset;
	const isTaskList = dataset?.type === "taskList";
	const isOL = node.nodeName === "OL";

	if (isTaskList) return dataset.checked === "true" ? "[x]" : "[ ]";
	return isOL ? `${index + 1}.` : "-";
};

const processListItems = (node: Node, level: number = 0): string => {
	let result = "";

	Array.from(node.childNodes).forEach((child, index) => {
		if (child.nodeName !== "LI") return;

		let itemContent = "";
		let additionalText = "";
		let nestedLists = "";

		Array.from(child.childNodes).forEach((childNode, childIndex) => {
			if (childNode.nodeName === "P") {
				if (childIndex === 0 || !itemContent) {
					itemContent = childNode.textContent || "";
				} else {
					additionalText += `\n${"\t".repeat(level)}  ${childNode.textContent}`;
				}
			} else if (LIST_TYPES.includes(childNode.nodeName)) {
				nestedLists += processListItems(childNode, level + 1);
			}
		});

		const prefix = getPrefix(node, index);
		result += `${"\t".repeat(level)}${prefix} ${itemContent}`;

		if (additionalText) {
			result += additionalText;
		}

		result += "\n" + nestedLists;
	});

	return result;
};

const processListItem = (li: Node, level: number = 0): string => {
	let result = "";

	const paragraphs: Node[] = [];
	const nestedLists: Node[] = [];

	Array.from(li.childNodes).forEach((child) => {
		if (child.nodeName === "P") {
			paragraphs.push(child);
		} else if (LIST_TYPES.includes(child.nodeName)) {
			nestedLists.push(child);
		}
	});

	const mainContent = paragraphs.length > 0 ? paragraphs[0].textContent || "" : "";

	result += `${"\t".repeat(level)}- ${mainContent}\n`;

	for (let i = 1; i < paragraphs.length; i++) {
		result += `${"\t".repeat(level)}  ${paragraphs[i].textContent}\n`;
	}

	nestedLists.forEach((list) => {
		result += processListItems(list, level + 1);
	});

	return result;
};

const hasNestedLists = (li: Node): boolean => {
	return Array.from(li.childNodes).some((child) => LIST_TYPES.includes(child.nodeName));
};

const isSimpleLiElement = (li: Node): boolean => {
	if (hasNestedLists(li)) return false;

	const hasOnlyOneParagraph = Array.from(li.childNodes).filter((child) => child.nodeName === "P").length === 1;

	return hasOnlyOneParagraph;
};

const processOtherNodes = (node: Node): string => {
	let text = "";

	const childNodes = Array.from(node.childNodes);

	childNodes.forEach((child, index) => {
		if (child.nodeName === "LI") {
			text += processListItem(child, 0);
		} else if (LIST_TYPES.includes(child.nodeName)) {
			text += processListItems(child, 0);
		} else if (child.nodeName === "#text") {
			const isParentSpan = child.parentNode?.nodeName === "SPAN";
			text += child.textContent + (index === childNodes.length - 1 && !isParentSpan ? "\n" : "") || "";
		} else {
			text += processOtherNodes(child);
		}
	});

	return text;
};

const createPlainText = (range: Range): string => {
	const nodes = range.cloneContents();
	let result = "";

	const childNodes = Array.from(nodes.childNodes);

	if (childNodes.length >= 1 && childNodes[0].nodeName === "#text") {
		childNodes.forEach((node) => {
			result += node.textContent || "";
		});

		return result;
	}

	if (childNodes.length === 1 && childNodes[0].nodeName === "LI") {
		const liElement = childNodes[0];

		if (isSimpleLiElement(liElement)) {
			return liElement.textContent || "";
		}

		return processListItem(liElement, 0);
	}

	result = processOtherNodes(nodes);
	return result.replace(/\n+$/, "");
};

export default createPlainText;
