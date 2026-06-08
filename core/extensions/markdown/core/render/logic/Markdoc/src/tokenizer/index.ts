import type { Schemes } from "@ext/markdown/core/Parser/Parser";
import htmlTokensInHtmlPlugin from "@ext/markdown/core/render/logic/Markdoc/src/tokenizer/plugins/htmlTokensInHtml";
import imgSizePlugin from "@ext/markdown/core/render/logic/Markdoc/src/tokenizer/plugins/imgSizePlugin";
import propertiesPlugin from "@ext/markdown/core/render/logic/Markdoc/src/tokenizer/plugins/properties";
import validateLinkPlugin from "@ext/markdown/elements/link/render/logic/validateLinkPlugin";
import listPlugin from "@ext/markdown/elements/list/edit/models/listItem/logic/listPlugin";
import taskListPlugin from "@ext/markdown/elements/list/edit/models/taskList/logic/taskListPlugin";
import notePlugin from "@ext/markdown/elements/note/logic/noteBlock";
import MarkdownIt from "markdown-it";
import type { Token } from "../types";
import annotations from "./plugins/annotations";
import disableencodeuri from "./plugins/disableencodeuri";
import { gitConflictPlugin } from "./plugins/gitConflictPlugin";

export default class Tokenizer {
	private _parser: MarkdownIt;

	constructor(config: MarkdownIt.Options & { allowIndentation?: boolean } = {}, tags?: Schemes["tags"]) {
		this._parser = new MarkdownIt(config);
		this._parser.use(taskListPlugin);
		this._parser.use(imgSizePlugin, "imgSizePlugin", {});
		this._parser.use(annotations, { tags });
		this._parser.use(disableencodeuri, "disableencodeuri", {});
		this._parser.use(gitConflictPlugin);
		this._parser.use(notePlugin);
		this._parser.use(htmlTokensInHtmlPlugin);
		this._parser.use(propertiesPlugin);
		this._parser.use(listPlugin);
		this._parser.disable("lheading");
		this._parser.use(validateLinkPlugin);
	}

	use(plugin: MarkdownIt.PluginWithParams, ...params: unknown[]): MarkdownIt {
		return this._parser.use(plugin, ...params);
	}

	tokenize(content: string): Token[] {
		return this._parser.parse(content.toString(), {});
	}

	renderToHtml(content: string): string {
		return this._parser.render(content);
	}

	getParser(): MarkdownIt {
		return this._parser;
	}
}
