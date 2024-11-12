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

class MarkdownFormatter {
	async render(editTree: JSONContent, context?: ParserContext): Promise<string> {
		if (editTree.content?.length == 1 && editTree.content[0].type == "paragraph" && !editTree.content[0].content)
			return "";

		const transformEditTree = JSONTransformer.transform(editTree, [filesFormatterTransformer]);
		const markdownSerializer = new ProsemirrorMarkdownSerializer(
			getNodeFormatters(context),
			getMarkFormatters(context),
		);
		const markdown = await markdownSerializer.serialize(Node.fromJSON(getSchema(), transformEditTree));
		const tags: Record<string, Schema> = getTagElementRenderModels(context);
		const mdParser = new MdParser({ tags });
		return mdParser.backParse(markdown);
	}
}

export default MarkdownFormatter;
