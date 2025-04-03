import {
	GramaxArticleTopLevelBlock,
	GramaxBaseArticleBlock,
	GramaxNoteBlock,
	GramaxTableBlock,
} from "@ext/serach/vector/GramaxArticle";
import { GramaxArticle } from "@ext/serach/vector/GramaxCatalog";
import { ArticleBlock } from "@ics/gx-vector-search";
import { JSONContent } from "@tiptap/core";

export type ParseContext = {
	article: GramaxArticle;
	useDefault?: boolean;
	lastTopLevelBlock: { value: GramaxArticleTopLevelBlock | null };
	headings: Map<JSONContent, GramaxArticleTopLevelBlock>;
	blocks: GramaxBaseArticleBlock[];
};

type ParseFunction = (content: JSONContent, context: ParseContext, parent?: ArticleBlock) => void;

const parseParagraph: ParseFunction = (paragraph, context, parent) => {
	const { headings, blocks, useDefault } = context;
	if (useDefault === false) {
		blocks.push(new GramaxArticleTopLevelBlock(paragraph, context.article, parent));
		return;
	}

	const nearestHeading = Array.from(headings.values())[Array.from(headings.values()).length - 1];
	context.lastTopLevelBlock.value = new GramaxArticleTopLevelBlock(paragraph, context.article, nearestHeading ?? null);
	blocks.push(context.lastTopLevelBlock.value);
};

const parseHeading: ParseFunction = (heading, context, parent) => {
	const { headings, blocks, useDefault } = context;
	if (useDefault === false) {
		blocks.push(new GramaxArticleTopLevelBlock(heading, context.article, parent));
		return;
	}

	if (heading.attrs.level === 2) {
		context.lastTopLevelBlock.value = new GramaxArticleTopLevelBlock(heading, context.article, null);
		blocks.push(context.lastTopLevelBlock.value);
		return;
	}

	const nearestHeading = Array.from(headings.keys())
		.reverse()
		.find((heading) => heading.attrs.level < heading.attrs.level);

	context.lastTopLevelBlock.value = new GramaxArticleTopLevelBlock(
		heading,
		context.article,
		nearestHeading ? headings.get(nearestHeading)! : null,
	);
	blocks.push(context.lastTopLevelBlock.value);
};

const parseList: ParseFunction = (list, context, parent) => {
	list.content.forEach((listItem) => {
		listItem.content.forEach((listItemContentItem, index) => {
			const itemParent = index === 0 ? parent : context.blocks[context.blocks.length - 1];
			getParseChildItem({ ...context, useDefault: false }, itemParent)(listItemContentItem);
		});
	});
};

const parseNote: ParseFunction = (note, context, parent) => {
	const noteBlock = new GramaxNoteBlock(note, context.article, parent);
	context.blocks.push(noteBlock);
	note.content.forEach((contentItem, index) => {
		const parent = index === 0 ? noteBlock : context.blocks[context.blocks.length - 1];

		if (contentItem.type === "paragraph" || contentItem.type === "heading" || contentItem.type === "note") {
			getParseChildItem({ ...context, useDefault: false }, noteBlock)(contentItem);
		} else {
			getParseChildItem({ ...context, useDefault: false }, parent)(contentItem);
		}
	});
};

const parseCodeBlock: ParseFunction = (codeBlock, context, parent) => {
	context.blocks.push(new GramaxArticleTopLevelBlock(codeBlock, context.article, parent));
};

const parseTable: ParseFunction = (table, context, parent) => {
	context.blocks.push(new GramaxTableBlock(table, context.article, parent));
};

const patsers: { [key: string]: ParseFunction } = {
	paragraph: parseParagraph,
	heading: parseHeading,
	code_block: parseCodeBlock,
	table: parseTable,
	note: parseNote,
	bulletList: parseList,
	orderedList: parseList,
};

const getParseChildItem = (parseContext: ParseContext, parent?: ArticleBlock) => (contentItem: JSONContent) => {
	const parser = patsers[contentItem.type];
	if (parser) parser(contentItem, parseContext, parent);
};

const getParseContentItem = (parseContext: ParseContext) => (contentItem: JSONContent) => {
	const parser = patsers[contentItem.type];
	if (parser)
		parser(
			contentItem,
			parseContext,
			contentItem.type !== "paragraph" && contentItem.type !== "heading"
				? parseContext.lastTopLevelBlock.value ?? null
				: null,
		);
};

export default getParseContentItem;
