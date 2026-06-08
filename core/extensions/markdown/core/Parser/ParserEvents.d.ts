import type { Content } from "@core/FileStructue/Article/Article";
import type PrivateParserContext from "./ParserContext/PrivateParserContext";
import type { PreTransformerFunc } from "./Transformer/preTransformTokens";

type DefaultParseEvent<T = string> = { context?: PrivateParserContext; requestUrl?: string; mutable: { content: T } };

type ParserEvents = Event<"before-parse", DefaultParseEvent<string>> &
	Event<"after-parse", DefaultParseEvent<Content>> &
	Event<
		"get-pre-transformers",
		{ mutable: { preTransformers: PreTransformerFunc[] }; context?: PrivateParserContext }
	> &
	Event<
		"get-edit-transformers",
		{
			mutable: { nodeTransformers: NodeTransformerFunc[]; tokenTransformers: TokenTransformerFunc[] };
			context?: PrivateParserContext;
		}
	>;

export default ParserEvents;
