import { MarkSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

function backticksFor(node, side) {
	const ticks = /`+/g;
	let len = 0;
	let m: RegExpExecArray;
	if (node.isText) while ((m = ticks.exec(node.text))) len = Math.max(len, m[0].length);
	let result = len > 0 && side > 0 ? " `" : "`";
	for (let i = 0; i < len; i++) result += "`";
	if (len > 0 && side < 0) result += " ";
	return result;
}

const getCodeFormatter = (): MarkSerializerSpec => {
	return {
		open(_state, _mark, parent, index) {
			return backticksFor(parent.child(index), -1);
		},
		close(_state, _mark, parent, index) {
			return backticksFor(parent.child(index - 1), 1);
		},
		escape: false,
		expelEnclosingWhitespace: true,
	};
};
export default getCodeFormatter;
