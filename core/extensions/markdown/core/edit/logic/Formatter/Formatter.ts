import MdParser from "@ext/markdown/core/Parser/MdParser/MdParser";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { Schema } from "@ext/markdown/core/render/logic/Markdoc";
import getTagElementRenderModels from "@ext/markdown/core/render/logic/getRenderElements/getTagElementRenderModels";
import filesFormatterTransformer from "@ext/markdown/elements/file/edit/logic/filesFormatterTransformer";
import { JSONContent } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { ProsemirrorMarkdownSerializer } from "../Prosemirror";
import JSONTransformer from "../Prosemirror/JSONTransformer";
import { getSchema } from "../Prosemirror/schema";
import getMarkFormatters from "./Formatters/getMarkFormatters";
import getNodeFormatters from "./Formatters/getNodeFormatters";
import commentModifyFormatters from "@ext/markdown/elements/comment/edit/logic/commentModifyFormatters";

class MarkdownFormatter {
	async render(editTree: JSONContent, context?: ParserContext): Promise<string> {
		const content = editTree.content;
		if (content?.length === 1 && content?.[0]?.type === "paragraph" && !content?.[0]?.content) return "";

		const transformEditTree = JSONTransformer.transform(editTree, [filesFormatterTransformer]);
		const markdownSerializer = new ProsemirrorMarkdownSerializer(
			getNodeFormatters(context, [commentModifyFormatters]),
			getMarkFormatters(context),
		);
		const markdown = await markdownSerializer.serialize(Node.fromJSON(getSchema(), transformEditTree));
		const tags: Record<string, Schema> = getTagElementRenderModels(context);
		const mdParser = new MdParser({ tags });
		return mdParser.backParse(markdown);
	}
}

export default MarkdownFormatter;
