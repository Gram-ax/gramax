import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const styleMapping: Record<string, string> = {
	bold: "strong",
	italic: "em",
	strikethrough: "s",
	underline: "strong",
	code: "code",
};

const text: NotionNodeConverter = (textNode) => {
	const marks: { type: string; attrs?: Record<string, any> }[] = [];

	for (const [style, isActive] of Object.entries(textNode?.annotations || {})) {
		if (isActive && styleMapping[style]) {
			marks.push({ type: styleMapping[style] });
		}
	}

	if (textNode?.href) {
		const isExternalLink = textNode.href.includes("http");
		const baseHref = isExternalLink ? textNode.href : `https://www.notion.so${textNode.href}`;

		marks.push({
			type: "link",
			attrs: {
				href: baseHref,
				resourcePath: "",
				hash: "",
				isFile: false,
			},
		});
	}

	if (textNode.marks) marks.push(...textNode.marks);

	let finalText = textNode.plain_text;

	if (textNode.type === "mention" && textNode.mention?.type === "date") {
		const date = new Date(textNode.mention.date?.start);
		if (date.getTime()) {
			const hasTime = textNode.mention.date?.start.includes("T");

			finalText = date.toLocaleString("de", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				...(hasTime && {
					hour: "2-digit",
					minute: "2-digit",
					hourCycle: "h23",
				}),
			});
		}
	}

	return {
		type: "text",
		text: finalText,
		marks: marks,
	};
};

export default text;
