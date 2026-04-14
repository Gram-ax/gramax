import type { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import type { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import type TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";

const TabsFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	async (state, node) => {
		node.attrs.childAttrs.map((attrs: TabAttrs, idx: number) => {
			(node.child(idx).attrs as any) = attrs;
		});
		state.write(`${formatter.openTag("tabs")}\n\n`);
		await state.renderContent(node);
		state.write(formatter.closeTag("tabs"));
		state.closeBlock(node);
	};

export default TabsFormatter;
