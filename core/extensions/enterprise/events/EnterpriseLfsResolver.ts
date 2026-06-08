import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import type { Workspace } from "@ext/workspace/Workspace";

export default class EnterpriseLfsResolver implements EventHandlerCollection {
	private _events = [];
	private _lock = false;

	constructor(private _workspace: Workspace) {}

	mount(): void {
		this._events.push(this._workspace.events.on("sync", ({ catalog }) => this._apply(catalog)));
	}

	private async _apply(catalog: Catalog): Promise<void> {
		if (!catalog?.repo || !(catalog.repo instanceof WorkdirRepository)) return;

		const config = await this._workspace.config();
		const lfsPatterns = config.enterprise?.lfs?.patterns;
		if (!lfsPatterns?.length) return;

		const attributes = await catalog.repo.attributes();
		const currentLfsPatterns = attributes.findPatternsByAttr("filter=lfs");

		const patternsMatch =
			lfsPatterns.length === currentLfsPatterns.length &&
			lfsPatterns.every((p) => currentLfsPatterns.includes(p));

		if (patternsMatch) return;

		await attributes.setAttrMany(lfsPatterns, "filter=lfs").save();
	}
}
