import Path from "@core/FileProvider/Path/Path";
import isURL from "@core-ui/utils/isURL";
import { getFormatterTypeByContext } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import { MarkSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { Mark, Node } from "@tiptap/pm/model";

function isPlainURL(link: Mark, parent: Node, index: number, side: number) {
	if (link.attrs.title || !/^\w+:/.test(link.attrs.href)) return false;
	const content = parent.child(index + (side < 0 ? -1 : 0));
	if (!content.isText || content.text != link.attrs.href || content.marks[content.marks.length - 1] != link)
		return false;
	if ((link.attrs.href as string).endsWith("-")) return false;
	if (index == (side < 0 ? 1 : parent.childCount - 1)) return true;
	const next = parent.child(index + (side < 0 ? -2 : 1));
	return !link.isInSet(next.marks);
}

const getLinkFormatter = (context?: ParserContext): MarkSerializerSpec => {
	const formatter = getFormatterTypeByContext(context);
	const isGFM = formatter.type === Syntax.github;

	return {
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
					? (resourcePath?.value ?? "")
					: ((isGFM ? resourcePath : resourcePath?.stripExtension) ?? mark.attrs.href) +
						(mark.attrs.hash ?? "");
			return isPlainURL(mark, parent, index, -1)
				? ">"
				: `](${link.includes(" ") ? `<${link.replaceAll("<", "\\<").replaceAll(">", "\\>")}>` : link})`;
		},
	};
};
export default getLinkFormatter;
