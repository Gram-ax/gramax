import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const TabFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	async (state, node) => {
		state.write(
			`${formatter.openTag("tab", {
				name: node.attrs.name,
				icon: node.attrs.icon,
				tag: node.attrs.tag,
			})}\n\n`,
		);
		await state.renderContent(node);
		state.write(formatter.closeTag("tab"));
		state.closeBlock(node);
	};

export default TabFormatter;
