import { JSONContent } from "@tiptap/core";
import ParserContext from "../../../Parser/ParserContext/ParserContext";

type NodeTransformerFunc = (
	node: JSONContent,
	previousNode?: JSONContent,
	nextNode?: JSONContent,
	context?: ParserContext,
	count?: number,
) => Promise<{ isSet: boolean; value: JSONContent }> | { isSet: boolean; value: JSONContent };

export default NodeTransformerFunc;
