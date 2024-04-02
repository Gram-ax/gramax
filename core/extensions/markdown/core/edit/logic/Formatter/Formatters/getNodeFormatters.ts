import { NodeSerializerSpec } from "../../Prosemirror/to_markdown";

import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import DiagramsFormatter from "@ext/markdown/elements/diagrams/logic/DiagramsFormatter";
import codeBlockFormatter from "@ext/markdown/elements/fence/edit/logic/codeBlockFormatter";
import OpenApiFormatter from "@ext/markdown/elements/openApi/edit/logic/OpenApiFormatter";
import TabFormatter from "@ext/markdown/elements/tabs/logic/TabFormatter";
import TabsFormatter from "@ext/markdown/elements/tabs/logic/TabsFormatter";
import SnippetFormatter from "@ext/markdown/elements/snippet/edit/logic/SnippetFormatter";
import screenSymbols from "@ext/markdown/logic/screenSymbols";
import TableUtils from "../Utils/Table";

const blocks = ["Db-diagram", "Db-table", "Snippet"];

const getNodeFormatters = (context?: ParserContext): { [node: string]: NodeSerializerSpec } => ({
	code_block: codeBlockFormatter,
	diagrams: DiagramsFormatter,
	snippet: SnippetFormatter,
	openapi: OpenApiFormatter,
	tabs: TabsFormatter,
	tab: TabFormatter,

	inlineMd_component: (state, node) => {
		const isBlock = blocks.includes(node.attrs.tag?.[0]?.name);
		if (isBlock) state.closeBlock(node);
		state.write(node.attrs.text);
		if (isBlock) state.closeBlock(node);
	},
	blockMd_component: (state, node) => {
		state.text(node.textContent, false);
		state.closeBlock(node);
	},
	blockMd: (state, node) => {
		state.text(node.textContent, false);
		state.closeBlock(node);
	},
	note: async (state, node) => {
		state.write(`:::${node.attrs.type ?? ""} ${node.attrs.title ?? ""}\n\n`);
		await state.renderContent(node);
		state.write(`:::`);
		state.closeBlock(node);
	},
	video: (state, node) => {
		state.write(`[video:${node.attrs.path ?? ""}:${node.attrs.title ?? ""}]`);
		state.closeBlock(node);
	},
	drawio: (state, node) => {
		state.write(`[drawio:${node.attrs.src ?? ""}:${screenSymbols(node.attrs.title) ?? ""}]`);
		state.closeBlock(node);
	},
	inlineCut_component: async (state, node) => {
		state.write(`[cut:${node.attrs.text ?? ""}:${node.attrs.expanded ?? ""}]`);
		await state.renderContent(node);
		state.write(`[/cut]`);
	},
	cut: async (state, node) => {
		state.write(`[cut:${node.attrs.text ?? ""}:${node.attrs.expanded ?? ""}]\n\n`);
		await state.renderContent(node);
		state.write(`[/cut]`);
		state.closeBlock(node);
	},
	comment: async (state, node) => {
		state.write(`[comment:${node.attrs.mail}:${node.attrs.dateTime}]\n\n`);
		await state.renderContent(node);
		state.write(`[/comment]`);
		state.closeBlock(node);
	},
	answer: async (state, node) => {
		state.write(`[answer:${node.attrs.mail}:${node.attrs.dateTime}]`);
		state.closeBlock(node);
		await state.renderContent(node);
		state.write(`[/answer]`);
		state.closeBlock(node);
	},
	table: async (state, node) => {
		if (TableUtils.tableIsSimple(node)) {
			const delim = state.delim;
			state.delim = "";
			state.write(await TableUtils.getSimpleTable(node, delim, context));
			state.delim = delim;
		} else {
			state.write(`{% table %}\n\n`);
			await state.renderContent(node);
			state.write(`{% /table %}\n`);
		}
		state.closeBlock(node);
	},
	tableRow: async (state, node) => {
		state.write(`---\n\n`);
		await state.renderList(
			node,
			() => "   ",
			() => (node.attrs.bullet || "*") + "  ",
		);
	},
	tableHeader: async (state, node) => {
		state.write(TableUtils.getTableAttributes({ ...node.attrs, isHeader: true }));
		await state.renderContent(node);
	},
	tableCell: async (state, node) => {
		state.write(TableUtils.getTableAttributes(node.attrs));
		await state.renderContent(node);
	},
	table_simple: async (state, node) => {
		await state.renderContent(node);
		state.closeBlock(node);
	},
	tableCell_simple: async (state, node) => {
		state.write("|");
		await state.renderInline(node);
	},
	tableHeader_simple: async (state, node) => {
		state.write("|");
		await state.renderInline(node);
	},
	tableBodyRow_simple: async (state, node) => {
		await state.renderContent(node);
		state.write("|\n");
	},
	tableHeaderRow_simple: async (state, node) => {
		await state.renderContent(node);
		state.write("|\n" + state.delim + "|-".repeat(node.childCount) + "|\n");
	},
	blockquote: async (state, node) => {
		await state.wrapBlock("> ", null, node, async () => await state.renderContent(node));
	},
	heading: async (state, node) => {
		state.write(state.repeat("#", node.attrs.level) + " ");
		await state.renderInline(node);
		if (node.attrs.isCustomId) state.write(` {#${node.attrs.id}}`);
		state.closeBlock(node);
	},
	horizontal_rule: (state, node) => {
		state.write(node.attrs.markup || "---");
		state.closeBlock(node);
	},
	style_wrapper: async (state, node) => {
		await state.renderContent(node);
	},
	bullet_list: async (state, node) => {
		await state.renderList(
			node,
			() => "   ",
			() => (node.attrs.bullet || "-") + "  ",
		);
	},
	ordered_list: async (state, node) => {
		const start: number = node.attrs.order || 1;
		await state.renderList(
			node,
			(i) => {
				const idx = String(start + i);
				return idx.length == 1 ? "   " : "    ";
			},
			(i) => {
				const idx = String(start + i);
				return idx + ". ";
			},
		);
	},
	list_item: async (state, node) => {
		await state.renderInline(node);
	},
	paragraph: async (state, node) => {
		if (node.content?.size) await state.renderInline(node);
		else state.write("\n");
		state.closeBlock(node);
	},
	image: (state, node) => {
		state.write(
			"![" +
				state.esc(node.attrs.alt || "") +
				"](" +
				node.attrs.src +
				(node.attrs.title ? ' "' + node.attrs.title.replace(/"/g, '\\"') + '"' : "") +
				")\n",
		);
		state.closeBlock(node);
	},
	hard_break(state, node, parent, index) {
		for (let i = index + 1; i < parent.childCount; i++)
			if (parent.child(i).type != node.type) {
				state.write("\\\n");
				return;
			}
	},
	br(state, node, parent, index) {
		for (let i = index + 1; i < parent.childCount; i++)
			if (parent.child(i).type != node.type) {
				state.write("\\\n");
				return;
			}
	},
	text: (state, node) => {
		state.text(node.marks ? node.text : node.text.trim());
	},
});

export default getNodeFormatters;
