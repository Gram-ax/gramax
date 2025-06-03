import type { EventArgs } from "@core/Event/EventEmitter";
import FileStructure, { type FSEvents } from "../../../logic/FileStructue/FileStructure";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import { ItemEvents } from "@core/FileStructue/Item/Item";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { Article } from "@core/FileStructue/Article/Article";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import { fillMarkdownTemplate, recursiveFindNode } from "@ext/templates/logic/utils";
import { editName as BLOCK_PROPERTY } from "@ext/markdown/elements/blockProperty/consts";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";

type ItemPreSaveEventArgs = EventArgs<ItemEvents, "item-pre-save"> & { catalog: Catalog };
type ItemGetContentEventArgs = EventArgs<ItemEvents, "item-get-content"> & { catalog: Catalog };

export default class FSTemplateEvents {
	private _parser: MarkdownParser;
	private _formatter: MarkdownFormatter;
	private _parserContextFactory: ParserContextFactory;

	constructor() {}

	mount(fs: FileStructure): void {
		fs.events.on("before-item-create", this._onBeforeItemCreate.bind(this));
		fs.events.on("item-serialize", this._onItemSerialize.bind(this));
		fs.events.on("item-props-updated", this._onItemPropsUpdated.bind(this));
	}

	withParser(parser: MarkdownParser, formatter: MarkdownFormatter, parserContextFactory: ParserContextFactory): void {
		this._parser = parser;
		this._formatter = formatter;
		this._parserContextFactory = parserContextFactory;
	}

	private async _onItemPropsUpdated({ item, catalog }: EventArgs<FSEvents, "item-props-updated">) {
		if (item.props.template && !(item as Article).content) {
			const mutable = { item };
			this._onBeforeItemCreate({ mutableItem: mutable, catalog });
			await (item as Article).updateContent("", true);
		}
	}

	private _onBeforeItemCreate({ catalog, mutableItem }: EventArgs<FSEvents, "before-item-create">) {
		if (!mutableItem.item.props.template) return;

		mutableItem.item.events.on("item-pre-save", async (args) => {
			await this._onItemPreSave({ ...args, catalog });
		});

		mutableItem.item.events.on("item-get-content", (args) => {
			this._onItemGetContent({ ...args, catalog });
		});
	}

	private _onItemSerialize({ mutable }: EventArgs<FSEvents, "item-serialize">) {
		if (mutable.props?.template) {
			mutable.content = "";
		}
	}

	private _onItemGetContent({ item, mutableContent, catalog }: ItemGetContentEventArgs) {
		if (item.props?.template) {
			const templateProvider = catalog.customProviders.templateProvider;
			const templateArticle = templateProvider.getArticle(item.props.template);

			if (templateArticle && !mutableContent.content) {
				mutableContent.content = fillMarkdownTemplate(
					item.props.fields,
					item.props.properties,
					templateArticle.content,
				);
			}
		}
	}

	private async _onItemPreSave({ item, catalog, mutable }: ItemPreSaveEventArgs) {
		if (!mutable.props?.template) return;

		const parserContext = await this._parserContextFactory.fromArticle(
			item as Article,
			catalog,
			defaultLanguage,
			true,
		);

		const content = await this._parser.parse(mutable.content, parserContext);

		const nodes = recursiveFindNode(content.editTree, BLOCK_PROPERTY);
		const mapNodes = new Map<string, string>();

		for (const node of nodes) {
			const bind = node.attrs.bind;

			if (mapNodes.has(bind)) continue;

			const formatted = await this._formatter.render(node, parserContext);
			mapNodes.set(bind, formatted);
		}

		if (mapNodes.size > 0) {
			const properties = mutable.props.properties || [];

			for (const [bind, formatted] of mapNodes.entries()) {
				const property = properties.findIndex((p) => p.name === bind);

				property === -1
					? properties.push({
							name: bind,
							value: [formatted],
					  })
					: (properties[property].value = [formatted]);
			}

			mutable.props.properties = properties;
		}
	}
}
