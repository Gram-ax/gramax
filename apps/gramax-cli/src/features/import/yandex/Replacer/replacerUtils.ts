export function transformAllTables(input: string): string {
	return input.replace(/#\|([\s\S]*?)\|#/g, (_match, tableContent) => {
		return transformOneTable(tableContent);
	});
}

function transformOneTable(tableContent: string): string {
	const rows = tableContent.split(/\|\|/);
	const rowData = rows
		.map((row) => {
			const cells = row.split("|").map((cell) => {
				const data = cell
					.trim()
					.split("\n")
					.map((content, index) => {
						if (index === 0) return content;
						return "   " + content;
					})
					.join("\n");

				if (typeof data === "string" && data === "") {
					return "";
				}

				return data;
			});
			if (cells.length === 1 && cells[0].length === 0) return [];

			return cells;
		})
		.filter((cells) => cells.length > 0);

	const lines: string[] = [];

	lines.push('{% table header="none" %}');
	lines.push("");

	rowData.forEach((cells) => {
		lines.push("---");
		lines.push("");
		(cells as string[]).forEach((cell) => {
			lines.push(`* ${cell}`);
			lines.push("");
		});
	});

	lines.push("{% /table %}");

	return lines.join("\n");
}
