import isURL from "@core-ui/utils/isURL";
import getSuggestionFormatter from "@ext/StyleGuide/extension/getSuggestionFormatter";
import Path from "../../../../../../../logic/FileProvider/Path/Path";
import getCommentFormatter from "../../../../../elements/comment/edit/logic/getCommentFormatter";
import ParserContext from "../../../../Parser/ParserContext/ParserContext";
import { MarkSerializerSpec } from "../../Prosemirror/to_markdown";

const getMarkFormatters = (context?: ParserContext): { [mark: string]: MarkSerializerSpec } => ({
	comment: getCommentFormatter(context),
	suggestion: getSuggestionFormatter(),
	s: { open: "~~", close: "~~", mixable: true, expelEnclosingWhitespace: true },
	em: { open: "*", close: "*", mixable: true, expelEnclosingWhitespace: true },
	strong: { open: "**", close: "**", mixable: true, expelEnclosingWhitespace: true },
	inlineMd: { open: "", close: "", escape: false, expelEnclosingWhitespace: true },
	link: {
		open(_state, mark, parent, index) {
			return isPlainURL(mark, parent, index, 1) ? "<" : "[";
		},
		close(_state, mark, parent, index) {
			const isFile = mark.attrs?.isFile ?? false;
			const resourcePath =
				mark.attrs.resourcePath && mark.attrs.resourcePath != "" ? new Path(mark.attrs.resourcePath) : null;
			const isUrl = isURL(resourcePath?.value);

			const link: string =
				isFile || isUrl
					? resourcePath?.value ?? ""
					: (resourcePath?.stripExtension ?? mark.attrs.href) + (mark.attrs.hash ?? "");
			return isPlainURL(mark, parent, index, -1) ? ">" : `](${link.includes(" ") ? `<${link}>` : link})`;
		},
	},

	code: {
		open(_state, _mark, parent, index) {
			return backticksFor(parent.child(index), -1);
		},
		close(_state, _mark, parent, index) {
			return backticksFor(parent.child(index - 1), 1);
		},
		escape: false,
	},
});

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
function isPlainURL(link, parent, index, side) {
	if (link.attrs.title || !/^\w+:/.test(link.attrs.href)) return false;
	const content = parent.child(index + (side < 0 ? -1 : 0));
	if (!content.isText || content.text != link.attrs.href || content.marks[content.marks.length - 1] != link)
		return false;
	if (index == (side < 0 ? 1 : parent.childCount - 1)) return true;
	const next = parent.child(index + (side < 0 ? -2 : 1));
	return !link.isInSet(next.marks);
}

export default getMarkFormatters;
