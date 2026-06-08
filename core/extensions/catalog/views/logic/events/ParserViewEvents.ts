import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import getTabsNodeTransformer from "@ext/markdown/elements/tabs/edit/logic/getTabsNodeTransformer";

export default class ParserViewEvents implements EventHandlerCollection {
	private _refs = [];

	constructor(private _parser: MarkdownParser) {}

	mount(): void {
		this._refs.push(
			this._parser.events.on("get-edit-transformers", ({ mutable, context }) => {
				mutable.nodeTransformers.push(getTabsNodeTransformer(context));
			}),
		);
	}
}
