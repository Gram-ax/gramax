import { Transformer } from "@ext/markdown/core/edit/logic/Prosemirror/transformer";

interface TokenTransformerProps {
	token: any;
	transformer: Transformer;
	previous?: any;
	parent?: any;
}

type TokenTransformerFunc = (props: TokenTransformerProps) => any | any[];

export default TokenTransformerFunc;
