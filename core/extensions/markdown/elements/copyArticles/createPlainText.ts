const LIST_TYPES = ["UL", "OL"];

const getPrefix = (node: Node, index: number = 0, liNode?: Node): string => {
	const isOL = node.nodeName === "OL";

	if (liNode && (liNode as HTMLElement).hasAttribute("data-checked")) {
		const checked = (liNode as HTMLElement).getAttribute("data-checked") === "true";
		return `- [${checked ? "x" : " "}]`;
	}
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
			if (childNode.nodeName === "P" || childNode.nodeName === "DIV") {
				const nestedList = Array.from(childNode.childNodes).find((n) => LIST_TYPES.includes(n.nodeName));
				if (nestedList) {
					Array.from(childNode.childNodes).forEach((n) => {
						if (n !== nestedList) {
							itemContent += (n.textContent || "").trim();
						}
					});
					nestedLists += processListItems(nestedList, level + 1);
				} else {
					if (childIndex === 0 || !itemContent) {
						itemContent = childNode.textContent || "";
					} else {
						additionalText += `\n${"\t".repeat(level)}  ${childNode.textContent}`;
					}
				}
			} else if (LIST_TYPES.includes(childNode.nodeName)) {
				nestedLists += processListItems(childNode, level + 1);
			}
		});

		const prefix = getPrefix(node, index, child);
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
		if (child.nodeName === "P" || child.nodeName === "DIV") {
			const hasInnerList = Array.from(child.childNodes).some((n) => LIST_TYPES.includes(n.nodeName));
			if (hasInnerList) {
				Array.from(child.childNodes).forEach((n) => {
					if (LIST_TYPES.includes(n.nodeName)) {
						nestedLists.push(n);
					} else {
						paragraphs.push(n);
					}
				});
			} else {
				paragraphs.push(child);
			}
		} else if (LIST_TYPES.includes(child.nodeName)) {
			nestedLists.push(child);
		}
	});

	const parent = li.parentNode as Node;
	const siblings = Array.from(parent.childNodes).filter((n): n is ChildNode => n.nodeName === "LI");
	const index = siblings.indexOf(li as ChildNode);
	const prefix = getPrefix(parent, index, li);

	const mainContent = paragraphs.length > 0 ? paragraphs.map((p) => p.textContent || "").join("") : "";
	result += `${"\t".repeat(level)}${prefix} ${mainContent}\n`;

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
