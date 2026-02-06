import LinkResourceManager from "@core/Link/LinkResourceManager";
import ResourceManager from "@core/Resource/ResourceManager";
import { Question } from "@ext/markdown/elements/question/types";

export interface ParsedContext {
	icons: Set<string>;
	snippet: Set<string>;
	questions: Map<string, Question>;
	getLinkManager(): LinkResourceManager;
	getResourceManager(): ResourceManager;
}

export class ArticleParsedContext implements ParsedContext {
	constructor(
		private _icons: Set<string>,
		private _snippet: Set<string>,
		private _questions: Map<string, Question>,
		private _linkManager: LinkResourceManager,
		private _resourceManager: ResourceManager,
	) {}

	getLinkManager(): LinkResourceManager {
		return this._linkManager;
	}

	getResourceManager(): ResourceManager {
		return this._resourceManager;
	}

	get icons(): Set<string> {
		return this._icons;
	}

	get snippet(): Set<string> {
		return this._snippet;
	}

	get questions(): Map<string, Question> {
		return this._questions;
	}

	static create(
		icons: Set<string>,
		snippet: Set<string>,
		questions: Map<string, Question>,
		linkManager: LinkResourceManager,
		resourceManager: ResourceManager,
	): ParsedContext {
		return new ArticleParsedContext(icons, snippet, questions, linkManager, resourceManager);
	}
}
