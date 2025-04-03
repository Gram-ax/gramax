import type Context from "@core/Context/Context";
import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import type MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";

export type MakeResourceUpdater = (catalog: ReadonlyCatalog) => ResourceUpdater;

export default class ResourceUpdaterFactory {
	constructor(
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _formatter: MarkdownFormatter,
	) {}

	withContext(ctx: Context): MakeResourceUpdater {
		return (c) => new ResourceUpdater(ctx, c, this._parser, this._parserContextFactory, this._formatter);
	}
}
