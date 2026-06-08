import type { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import type { GlobalFormatter } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import NodeProperties from "@ext/properties/logic/utils/NodeProperties";

const propertyFormatter =
	(formatter: FormatterType): GlobalFormatter =>
	(state, node) => {
		if (node.attrs.property) {
			const properties = NodeProperties.toMarkdown(node.attrs.property, formatter);
			state.write(properties);
		}
	};

export default propertyFormatter;
