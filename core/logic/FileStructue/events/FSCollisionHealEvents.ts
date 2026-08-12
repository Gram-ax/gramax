import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import type Context from "@core/Context/Context";
import type { EventArgs } from "@core/Event/EventEmitter";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import { Article } from "@core/FileStructue/Article/Article";
import type { Category } from "@core/FileStructue/Category/Category";
import type FileStructure from "@core/FileStructue/FileStructure";
import type { FSEvents } from "@core/FileStructue/FileStructure";
import type ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import { span, trace } from "@ext/loggers/opentelemetry";

/**
 * After FileStructure heals an article/category name collision at hydrate (fold or rename), the
 * affected file paths changed and inbound links must be repointed — the same way the explicit
 * article→category convert path (`Catalog.createCategoryByArticle`) repoints them. Hydrate runs
 * outside any user request, so there is no request `Context`; the ResourceUpdater only reads
 * `contentLanguage` from it (falling back to the catalog language), and every parse produced here
 * is dropped afterwards so real requests re-parse with their own context.
 */
export default class FSCollisionHealEvents implements EventHandlerCollection {
	constructor(
		private _fs: FileStructure,
		private _resourceUpdaterFactory: ResourceUpdaterFactory,
	) {}

	mount(): void {
		this._fs.events.on("catalog-collision-healed", (args) => this._onCollisionHealed(args));
	}

	@trace({ omitArgs: true, omitResult: true })
	private async _onCollisionHealed({ catalog, movements }: EventArgs<FSEvents, "catalog-collision-healed">) {
		const ctx = { contentLanguage: undefined, user: undefined } as unknown as Context;
		const resourceUpdater = this._resourceUpdaterFactory.withContext(ctx)(catalog);

		try {
			for (const movement of movements) {
				// fold: the article body moved into `<name>/_index.md` — one directory deeper, so its
				// own relative links/resources must be rebased (renames stay in place and need none).
				if (movement.newPath.nameWithExtension !== CATEGORY_ROOT_FILENAME) continue;

				const category = catalog.findItemByItemPath<Category>(movement.newPath);
				if (!category) continue;

				const oldArticle = new Article({
					ref: this._fs.fp.getItemRef(movement.oldPath),
					parent: category.parent,
					content: await category.getContent(),
					props: { ...category.props },
					logicPath: category.logicPath,
					fs: this._fs,
					lastModified: 0,
				});
				await resourceUpdater.update(oldArticle, category);
			}

			await resourceUpdater.updateOtherArticlesBatch(movements);
		} catch (e) {
			// healing links is best-effort: a stale link must not fail the catalog load
			span()?.addEvent("collision-link-repoint-failed", { error: String(e) });
		} finally {
			// parses above ran with a synthetic context — drop them so requests re-parse
			await Promise.all(catalog.getContentItems().map((item) => item.parsedContent.write(() => null)));
		}
	}
}
