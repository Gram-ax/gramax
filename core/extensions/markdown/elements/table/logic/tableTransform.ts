import { Token } from "@ext/markdown/core/render/logic/Markdoc";

const tableTransform = (tokens: Token[]) => {
	let depth = -1;
	const tableStates: {
		isCell: boolean;
		isCellList: number;
		colwidths: any[];
		cellIdx: number;
	}[] = [];

	for (let idx = 0; idx < tokens.length; idx++) {
		const token = tokens[idx];
		if (token.type === "tag_open" && (token.info === "table" || token.info.startsWith("table "))) {
			depth++;
			tableStates[depth] = {
				isCell: false,
				isCellList: 0,
				colwidths: [],
				cellIdx: 0,
			};

			const tableOpen: any = {
				type: "table_open",
				tag: "table",
				nesting: 1,
				attrs: {},
			};
			if (token?.meta) tableOpen.meta = token.meta;
			if (token?.meta?.attributes?.[0]?.value) tableOpen.attrs.header = token.meta.attributes[0].value;

			(tokens as any).splice(idx, 1, tableOpen);
			if (
				tokens[idx + 1]?.type === "paragraph_open" &&
				tokens[idx + 2]?.type === "inline" &&
				tokens[idx + 3]?.type === "paragraph_close"
			) {
				const colgroup = tokens[idx + 2].children;
				if (colgroup[0]?.meta?.tag === "colgroup")
					for (let i = 1; i < colgroup.length; i++) {
						const currentToken = colgroup[i];
						if (currentToken.type === "tag" && currentToken.meta?.tag === "col") {
							const colwidth = currentToken.meta.attributes?.find((a) => a.name === "width")?.value;
							tableStates[depth].colwidths.push(colwidth);
						}
						if (currentToken.type === "tag_close" && currentToken.meta?.tag === "colgroup") {
							(tokens as any).splice(idx + 1, 3, {
								type: "tbody_open",
								tag: "tbody",
								nesting: 1,
							});
							break;
						}
					}
			} else {
				(tokens as any).splice(idx + 1, 0, { type: "tbody_open", tag: "tbody", nesting: 1 });
			}
			continue;
		}
		if (token.type === "tag_close" && token.info === "/table") {
			(tokens as any).splice(
				idx,
				1,
				{ type: "tbody_close", tag: "tbody", nesting: -1 },
				{ type: "table_close", tag: "table", nesting: -1 },
			);
			depth--;
		}
		if (depth !== -1) {
			if (token.type === "hr") {
				if (tokens[idx + 1].type === "hr") {
					(tokens as any).splice(idx, 0, { type: "tr_open", tag: "tr", nesting: 1 });
					idx++;
					(tokens as any).splice(idx, 0, { type: "tr_close", tag: "tr", nesting: -1 });
					idx++;
				}
				tokens.splice(idx, 1);
				idx--;
			}
			if (
				tableStates[depth].isCell &&
				(token.type === "bullet_list_open" || token.type === "ordered_list_open")
			) {
				tableStates[depth].isCellList++;
			}
			if (tableStates[depth].isCellList) {
				if (token.type === "bullet_list_close" || token.type === "ordered_list_close") {
					tableStates[depth].isCellList--;
				}
				continue;
			}
			if (token.type === "bullet_list_open" || (token.type === "tag_open" && token.meta.tag === "tr")) {
				(tokens as any).splice(idx, 1, { type: "tr_open", tag: "tr", nesting: 1 });
				tableStates[depth].cellIdx = 0;
			}
			if (token.type === "bullet_list_close" || (token.type === "tag_close" && token.meta.tag === "tr"))
				(tokens as any).splice(idx, 1, { type: "tr_close", tag: "tr", nesting: -1 });
			if (token.type === "list_item_open" || (token.type === "tag_open" && token.meta.tag === "td")) {
				tableStates[depth].isCell = true;
				const isAnnotation = tokens[idx + 1].type === "annotation";
				const attrs: any = {};
				if (isAnnotation) tokens[idx + 1].meta.attributes?.forEach((a) => (attrs[a.name] = a.value));
				if (token.type === "tag_open") token.meta.attributes?.forEach((a) => (attrs[a.name] = a.value));
				if (attrs.colspan && typeof attrs.colspan === "string") attrs.colspan = parseFloat(attrs.colspan);
				if (attrs.rowspan && typeof attrs.rowspan === "string") attrs.rowspan = parseFloat(attrs.rowspan);
				if (attrs.colwidth && !Array.isArray(attrs.colwidth)) attrs.colwidth = [attrs.colwidth];
				if (tableStates[depth].colwidths.length > 0) {
					const colwidth = [];
					const colspan = attrs.colspan || 1;
					for (let i = tableStates[depth].cellIdx; i < colspan + tableStates[depth].cellIdx; i++)
						colwidth.push(parseFloat(tableStates[depth].colwidths[i]));

					if (colwidth.some((w) => w)) attrs.colwidth = colwidth;
					tableStates[depth].cellIdx += colspan;
				}
				(tokens as any).splice(idx, isAnnotation ? 2 : 1, {
					type: "td_open",
					tag: "td",
					nesting: 1,
					attrs: attrs,
					meta: isAnnotation ? tokens[idx + 1].meta : null,
				});
			}
			if (token.type === "list_item_close" || (token.type === "tag_close" && token.meta.tag === "td")) {
				tableStates[depth].isCell = false;
				(tokens as any).splice(idx, 1, {
					type: "td_close",
					tag: "td",
					nesting: -1,
				});
			}
		}
		if (token?.children) token.children = tableTransform(token.children);
	}

	for (let idx = 0; idx < tokens.length; idx++) {
		if ((tokens[idx].type === "td_open" || tokens[idx].type === "th_open") && tokens[idx + 1].type === "inline") {
			(tokens as any).splice(idx + 1, 1, { type: "paragraph_open", tag: "p", nesting: 1 }, tokens[idx + 1], {
				type: "paragraph_close",
				tag: "p",
				nesting: -1,
			});
		}
	}
	return tokens;
};

export default tableTransform;
