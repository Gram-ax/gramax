const LIST_TYPES = ["UL", "OL"];

const getPrefix = (node: Node, index: number = 0): string => {
	const dataset = (node as HTMLElement).dataset;
	const isTaskList = dataset.type === "taskList";
	const isOL = node.nodeName === "OL";

	if (isTaskList) return dataset.checked === "true" ? "[x]" : "[ ]";
	return isOL ? `${index + 1}.` : "-";
};

const createListText = (node: Node, level: number = 0): string => {
	let text = "";
	if (!LIST_TYPES.includes(node.nodeName)) return text;

	Array.from(node.childNodes).forEach((child, index) => {
		if (child.nodeName !== "LI") return;

		const prefix = getPrefix(node, index);
		text += `${"\t".repeat(level)}${prefix} `;
		text += getRecursiveText(child, level + 1).trim() + "\n";
	});

	return text;
};

const getRecursiveText = (node: Node, level: number = 0): string => {
	let text = "";
	if (node.nodeName === "#text") return node.textContent.trim() + "\n";

	if (LIST_TYPES.includes(node.nodeName)) text += createListText(node, level);
	else {
		if (node.childNodes.length === 1 && node.firstChild?.nodeName === "#text") {
			text += `${"\t".repeat(level)}${node.textContent.trim()}\n`;
		} else {
			Array.from(node.childNodes).forEach((child) => {
				text += getRecursiveText(child, level);
			});
		}
	}

	return text;
};

const getStartListInfo = (range: Range) => {
	const startContainer = range.startContainer;

	let listType = "";
	let isTaskList = false;
	let firstIsText = false;
	let currentNode = startContainer;

	while (currentNode) {
		if (LIST_TYPES.includes(currentNode.nodeName)) {
			const dataset = (currentNode as HTMLElement).dataset;

			listType = currentNode.nodeName;
			isTaskList = dataset.type === "taskList";
			break;
		}

		firstIsText = true;
		currentNode = currentNode.parentNode as HTMLElement;
	}

	return {
		listType,
		isTaskList,
		firstIsText,
	};
};

const createList = (nodes: Node, listType: string, isTaskList: boolean): Node => {
	const list = document.createElement(listType.toLowerCase());
	if (isTaskList) list.dataset.type = "taskList";

	if (nodes.firstChild?.nodeName !== "LI") {
		const li = document.createElement("li");
		let lastindex = 0;
		Array.from(nodes.childNodes).some((child, index) => {
			if (LIST_TYPES.includes(child.nodeName)) return li.appendChild(child);
			else li.appendChild(child);
			lastindex = index;
		});

		list.appendChild(li);

		Array.from(nodes.childNodes)
			.slice(lastindex + 1)
			.forEach((child) => {
				list.appendChild(child);
			});
	} else list.appendChild(nodes);

	return list;
};

const createPlainText = (range: Range): string => {
	const nodes = range.cloneContents();
	const { listType, isTaskList, firstIsText } = getStartListInfo(range);

	let text = "";
	if (listType) {
		if (firstIsText) {
			const list = createList(nodes, listType, isTaskList);
			text = getRecursiveText(list);
		} else text = getRecursiveText(nodes);
	} else text = getRecursiveText(nodes);

	return text;
};

export default createPlainText;
