import type { Schemes } from "@ext/markdown/core/Parser/Parser";
import imgSizePlugin from "@ext/markdown/core/render/logic/Markdoc/src/tokenizer/plugins/imgSizePlugin";
import validateLinkPlugin from "@ext/markdown/elements/link/render/logic/validateLinkPlugin";
import listPlugin from "@ext/markdown/elements/list/edit/models/listItem/logic/listPlugin";
import taskListPlugin from "@ext/markdown/elements/list/edit/models/taskList/logic/taskListPlugin";
import notePlugin from "@ext/markdown/elements/note/logic/noteBlock";
import MarkdownIt from "markdown-it/lib";
import type { Token } from "../types";
import annotations from "./plugins/annotations";
import disableencodeuri from "./plugins/disableencodeuri";
import { gitConflictPlugin } from "./plugins/gitConflictPlugin";

export default class Tokenizer {
	private parser: MarkdownIt;

	constructor(config: MarkdownIt.Options & { allowIndentation?: boolean } = {}, tags?: Schemes["tags"]) {
		this.parser = new MarkdownIt(config);
		this.parser.use(taskListPlugin);
		this.parser.use(imgSizePlugin, "imgSizePlugin", {});
		this.parser.use(annotations, { tags });
		this.parser.use(disableencodeuri, "disableencodeuri", {});
		this.parser.use(gitConflictPlugin);
		this.parser.use(notePlugin);
		this.parser.use(listPlugin);
		this.parser.disable("lheading");
		this.parser.use(validateLinkPlugin);
	}

	use(plugin: MarkdownIt.PluginWithParams, ...params: unknown[]): MarkdownIt {
		return this.parser.use(plugin, ...params);
	}

	tokenize(content: string): Token[] {
		return this.parser.parse(content.toString(), {});
	}

	renderToHtml(content: string): string {
		return this.parser.render(content);
	}

	getParser(): MarkdownIt {
		return this.parser;
	}
}
