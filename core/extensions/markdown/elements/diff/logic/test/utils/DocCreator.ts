export default class DocCreator {
	private content: any[] = [];

	static create() {
		return new DocCreator();
	}

	p(...content: (string | { type: string; text: string })[]) {
		this.content.push(DocCreator.p(...content));
		return this;
	}
	static p(...content: (string | { type: string; text: string })[]) {
		const filteredContent = content.filter((item) => (typeof item === "string" ? item !== "" : item.text !== ""));
		if (filteredContent.length === 0) {
			return {
				type: "paragraph",
			};
		}

		return {
			type: "paragraph",
			content: filteredContent.map((item) =>
				typeof item === "string"
					? { type: "text", text: item }
					: { type: "text", marks: [{ type: item.type }], text: item.text },
			),
		};
	}

	h(level: number, ...content: (string | { type: string; text: string })[]) {
		this.content.push(DocCreator.h(level, ...content));
		return this;
	}

	static h(level: number, ...content: (string | { type: string; text: string })[]) {
		const filteredContent = content.filter((item) => (typeof item === "string" ? item !== "" : item.text !== ""));
		if (filteredContent.length === 0) {
			return {
				type: "heading",
				attrs: {
					id: null,
					level: level,
					isCustomId: false,
				},
			};
		}

		return {
			type: "heading",
			attrs: {
				id: null,
				level: level,
				isCustomId: false,
			},
			content: filteredContent.map((item) =>
				typeof item === "string"
					? { type: "text", text: item }
					: { type: "text", marks: [{ type: item.type }], text: item.text },
			),
		};
	}

	bulletList(...listItems: any[]): DocCreator {
		this.content.push(DocCreator.bulletList(...listItems));
		return this;
	}

	static bulletList(...listItems: any[]) {
		return {
			type: "bulletList",
			content: listItems,
		};
	}

	orderedList(...listItems: any[]): DocCreator {
		this.content.push(DocCreator.orderedList(...listItems));
		return this;
	}

	static orderedList(...listItems: any[]) {
		return {
			type: "orderedList",
			attrs: { start: 1, type: undefined },
			content: listItems,
		};
	}

	static listItem(...content: any[]) {
		return {
			type: "listItem",
			attrs: { isTaskItem: null },
			content: content,
		};
	}

	replace(path: number[], newElement: any) {
		let current = this.content;
		for (let i = 0; i < path.length - 1; i++) {
			const index = path[i];
			if (current[index] && current[index].content) {
				current = current[index].content;
			} else {
				return this;
			}
		}
		const lastIndex = path[path.length - 1];
		if (lastIndex >= 0 && lastIndex < current.length) {
			current[lastIndex] = newElement;
		}
		return this;
	}

	remove(path: number[]) {
		let current = this.content;
		for (let i = 0; i < path.length - 1; i++) {
			const index = path[i];
			if (current[index] && current[index].content) {
				current = current[index].content;
			} else {
				return this;
			}
		}
		const lastIndex = path[path.length - 1];
		if (lastIndex >= 0 && lastIndex < current.length) {
			current.splice(lastIndex, 1);
		}
		return this;
	}

	insertAfter(path: number[], newElement: any) {
		let current = this.content;
		for (let i = 0; i < path.length - 1; i++) {
			const index = path[i];
			if (current[index] && current[index].content) {
				current = current[index].content;
			} else {
				return this;
			}
		}
		const lastIndex = path[path.length - 1];
		if (lastIndex >= 0 && lastIndex <= current.length) {
			current.splice(lastIndex + 1, 0, newElement);
		}
		return this;
	}

	value() {
		return this.content;
	}
}
