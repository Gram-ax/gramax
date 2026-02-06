import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { JSONContent } from "@tiptap/core";

type NodeTransformerFunc = (
	node: JSONContent,
	previousNode?: JSONContent,
	nextNode?: JSONContent,
	context?: ParserContext,
	count?: number,
) => Promise<{ isSet: boolean; value: JSONContent }> | { isSet: boolean; value: JSONContent };

export default NodeTransformerFunc;
