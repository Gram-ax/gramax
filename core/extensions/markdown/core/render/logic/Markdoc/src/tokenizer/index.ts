import MarkdownIt from "markdown-it/lib";
import { Token } from "../types";
import annotations from "./plugins/annotations";
import frontmatter from "./plugins/frontmatter";
import disableencodeuri from "./plugins/disableencodeuri";
import taskListPlugin from "./plugins/taskListPlugin";

export default class Tokenizer {
	private parser: MarkdownIt;

	constructor(config: MarkdownIt.Options & { allowIndentation?: boolean } = {}) {
		this.parser = new MarkdownIt(config);
		this.parser.use(taskListPlugin);
		this.parser.use(annotations, "annotations", {});
		this.parser.use(disableencodeuri, "disableencodeuri", {});
		this.parser.use(frontmatter, "frontmatter", {});
		this.parser.disable("lheading");
	}

	use(plugin: MarkdownIt.PluginWithParams, ...params: any[]): MarkdownIt {
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
