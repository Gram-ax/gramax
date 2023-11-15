import { Node as ProseMirrorNode } from "prosemirror-model";

const isTypeOf = (node: ProseMirrorNode, types: string | string[]): boolean => {
	return typeof types === "string" ? node.type.name === types : types.includes(node.type.name);
};

export default isTypeOf;
