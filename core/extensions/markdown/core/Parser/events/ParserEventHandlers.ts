import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import ParserViewEvents from "@ext/catalog/views/logic/events/ParserViewEvents";
import type MarkdownParser from "../Parser";

export default class ParserEventHandlers extends EventHandlerProvider {
	constructor(parser: MarkdownParser) {
		super();
		this._handlers = [new ParserViewEvents(parser)];
	}
}
