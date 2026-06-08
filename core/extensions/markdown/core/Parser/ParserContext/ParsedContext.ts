import type LinkResourceManager from "@core/Link/LinkResourceManager";
import type ResourceManager from "@core/Resource/ResourceManager";
import type { Question } from "@ext/markdown/elements/question/types";

export interface ParsedContext {
	icons: Set<string>;
	fragment: Set<string>;
	questions: Map<string, Question>;
	getLinkManager(): LinkResourceManager;
	getResourceManager(): ResourceManager;
}

export class ArticleParsedContext implements ParsedContext {
	constructor(
		private _icons: Set<string>,
		private _fragment: Set<string>,
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

	get fragment(): Set<string> {
		return this._fragment;
	}

	get questions(): Map<string, Question> {
		return this._questions;
	}

	static create(
		icons: Set<string>,
		fragment: Set<string>,
		questions: Map<string, Question>,
		linkManager: LinkResourceManager,
		resourceManager: ResourceManager,
	): ParsedContext {
		return new ArticleParsedContext(icons, fragment, questions, linkManager, resourceManager);
	}
}
