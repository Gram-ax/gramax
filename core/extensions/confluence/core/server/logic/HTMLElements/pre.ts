import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const pre: HTMLNodeConverter = (preNode) => {
	const codeNode = preNode.querySelector("code");
	const codeText = codeNode ? codeNode.textContent : preNode.innerHTML;

	if (!codeText) return null;

	if (codeNode) {
		return {
			type: "code_block",
			content: [{ type: "text", text: codeText }],
		};
	} else {
		const lines = codeText.split(/<br\s*\/?>/i);
		return lines.map((line) => {
			if (line) {
				return {
					type: "paragraph",
					content: [
						{
							type: "text",
							text: line.trim(),
							marks: [
								{
									type: "code",
								},
							],
						},
					],
				};
			} else {
				return {
					type: "paragraph",
				};
			}
		});
	}
};

export default pre;
