import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import AttributeFormatter from "@ext/markdown/elements/view/render/logic/attributesFormatter";
import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";

const viewNodeFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) => {
		state.write(formatter.openTag("view", new AttributeFormatter().stringify(node.attrs), true));
		state.closeBlock(node);
	};

export default viewNodeFormatter;
