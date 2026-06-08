/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
/** biome-ignore-all lint/suspicious/noAssignInExpressions: expected */
import type { PreTransformerFunc } from "@ext/markdown/core/Parser/Transformer/preTransformTokens";
import { COL_MIN_WIDTH } from "@ext/markdown/elements/table/edit/model/nodes/customTable";
import type Token from "markdown-it/lib/token";

const tableTransform: PreTransformerFunc = ({ tokens, ...otherProps }) => {
	let depth = -1;
	const tableStates: {
		isCell: boolean;
		isCellList: number;
		colwidths: string[];
		realCol: number;
		rowSpans: number[];
	}[] = [];

	const closeRow = () => {
		for (let i = 0; i < tableStates[depth].rowSpans.length; i++) {
			if (tableStates[depth].rowSpans[i] > 0) {
				tableStates[depth].rowSpans[i]--;
			}
		}
	};

	for (let idx = 0; idx < tokens.length; idx++) {
		const token = tokens[idx];
		if (token.type === "tag_open" && (token.info === "table" || token.info.startsWith("table "))) {
			depth++;
			tableStates[depth] = {
				isCell: false,
				isCellList: 0,
				colwidths: [],
				realCol: 0,
				rowSpans: [],
			};

			const tableOpen = {
				type: "table_open",
				tag: "table",
				nesting: 1,
				attrs: {},
			} as Token;
			if (token?.meta) tableOpen.meta = token.meta;
			(token?.meta?.attributes as [])?.forEach(({ name, value }) => {
				tableOpen.attrs[name] = value;
			});

			tokens.splice(idx, 1, tableOpen);
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
							tokens.splice(idx + 1, 3, {
								type: "tbody_open",
								tag: "tbody",
								nesting: 1,
							} as Token);
							break;
						}
					}
			} else {
				tokens.splice(idx + 1, 0, { type: "tbody_open", tag: "tbody", nesting: 1 } as Token);
			}
			continue;
		}
		if (token.type === "tag_close" && token.info === "/table") {
			tokens.splice(
				idx,
				1,
				{ type: "tbody_close", tag: "tbody", nesting: -1 } as Token,
				{ type: "table_close", tag: "table", nesting: -1 } as Token,
			);
			depth--;
		}
		if (depth !== -1) {
			if (token.type === "hr") {
				if (tokens[idx + 1].type === "hr") {
					tokens.splice(idx, 0, { type: "tr_open", tag: "tr", nesting: 1 } as Token);
					idx++;
					tokens.splice(idx, 0, { type: "tr_close", tag: "tr", nesting: -1 } as Token);
					idx++;
					closeRow();
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
				tokens.splice(idx, 1, { type: "tr_open", tag: "tr", nesting: 1 } as Token);
				tableStates[depth].realCol = 0;
			}
			if (token.type === "bullet_list_close" || (token.type === "tag_close" && token.meta.tag === "tr")) {
				tokens.splice(idx, 1, { type: "tr_close", tag: "tr", nesting: -1 } as Token);
				closeRow();
			}
			if (token.type === "list_item_open" || (token.type === "tag_open" && token.meta.tag === "td")) {
				tableStates[depth].isCell = true;

				while (tableStates[depth].rowSpans[tableStates[depth].realCol] > 0) {
					tableStates[depth].realCol++;
				}

				const isAnnotation = tokens[idx + 1].type === "annotation";
				const attrs: Record<string, any> = {};
				if (isAnnotation)
					tokens[idx + 1].meta.attributes?.forEach((a) => {
						attrs[a.name] = a.value;
					});
				if (token.type === "tag_open")
					token.meta.attributes?.forEach((a) => {
						attrs[a.name] = a.value;
					});
				if (attrs.colspan && typeof attrs.colspan === "string") attrs.colspan = parseFloat(attrs.colspan);
				if (attrs.rowspan && typeof attrs.rowspan === "string") attrs.rowspan = parseFloat(attrs.rowspan);
				if (attrs.colwidth && !Array.isArray(attrs.colwidth)) attrs.colwidth = [attrs.colwidth];
				if (attrs.colwidth) attrs.colwidth = attrs.colwidth.map((c) => Math.max(parseFloat(c), COL_MIN_WIDTH));
				if (tableStates[depth].colwidths.length > 0) {
					const colspan = attrs.colspan ?? 1;
					const rowspan = attrs.rowspan ?? 1;

					const colwidth: number[] = [];
					for (let c = 0; c < colspan; c++) {
						const col = tableStates[depth].realCol + c;

						while (tableStates[depth].rowSpans.length <= col) {
							tableStates[depth].rowSpans.push(0);
						}

						const w = tableStates[depth].colwidths[col];
						if (w) {
							colwidth.push(Math.max(parseFloat(String(w)), COL_MIN_WIDTH));
						}
					}

					if (colwidth.length > 0) {
						attrs.colwidth = colwidth;
					}

					if (rowspan > 1) {
						for (let c = 0; c < colspan; c++) {
							const col = tableStates[depth].realCol + c;
							while (tableStates[depth].rowSpans.length <= col) {
								tableStates[depth].rowSpans.push(0);
							}
							tableStates[depth].rowSpans[col] = rowspan;
						}
					}

					tableStates[depth].realCol += colspan;
				}
				tokens.splice(idx, isAnnotation ? 2 : 1, {
					type: "td_open",
					tag: "td",
					nesting: 1,
					attrs: attrs,
					meta: isAnnotation ? tokens[idx + 1].meta : null,
				} as Token);
			}
			if (token.type === "list_item_close" || (token.type === "tag_close" && token.meta.tag === "td")) {
				tableStates[depth].isCell = false;
				tokens.splice(idx, 1, {
					type: "td_close",
					tag: "td",
					nesting: -1,
				} as Token);
			}
		}
		if (token?.children) token.children = tableTransform({ tokens: token.children, ...otherProps });
	}

	for (let idx = 0; idx < tokens.length; idx++) {
		if ((tokens[idx].type === "td_open" || tokens[idx].type === "th_open") && tokens[idx + 1].type === "inline") {
			tokens.splice(idx + 1, 1, { type: "paragraph_open", tag: "p", nesting: 1 } as Token, tokens[idx + 1], {
				type: "paragraph_close",
				tag: "p",
				nesting: -1,
			} as Token);
		}
	}
	return tokens;
};

export default tableTransform;
