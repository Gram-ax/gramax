import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { FsEventDto } from "@ext/Watchers/FsEvent";
import { isDocRootFsPath } from "@ext/Watchers/isDocRootFsPath";

export type ClassifiedFsEvent =
	| { type: "ignore" }
	| { type: "structural" }
	| { type: "patch"; catalogRel: Path; articleRelPath: string };

export type ClassifierDeps = {
	catalog: Catalog;
	fp: FileProvider;
	isSelfWrite: (workspaceRel: string) => boolean;
	currentArticlePath?: string;
	isCurrentArticleResource?: (workspaceRel: string) => Promise<boolean>;
};

export async function classifyFsEvent(event: FsEventDto, deps: ClassifierDeps): Promise<ClassifiedFsEvent> {
	const { catalog, fp, isSelfWrite, currentArticlePath, isCurrentArticleResource } = deps;

	const eventPaths = event.kind.type === "renamed" ? [event.relPath, event.kind.from] : [event.relPath];
	const inCatalog = eventPaths
		.map((raw) => ({ raw, rel: catalog.toCatalogRelativePath(new Path(raw)) }))
		.filter((c): c is { raw: string; rel: Path } => c.rel !== null);

	if (inCatalog.length === 0) return { type: "ignore" };
	if (inCatalog.every((c) => isSelfWrite(c.raw))) return { type: "ignore" };

	if (event.kind.type !== "modified") return { type: "structural" };
	if (isDocRootFsPath(event.relPath)) return { type: "structural" };
	if (!(await fp.exists(new Path(event.relPath)))) return { type: "structural" };

	if (event.relPath.endsWith(".md")) {
		return { type: "patch", catalogRel: inCatalog[0].rel, articleRelPath: event.relPath };
	}

	if (currentArticlePath && (await isCurrentArticleResource?.(event.relPath))) {
		const currentRel = catalog.toCatalogRelativePath(new Path(currentArticlePath));
		if (currentRel) return { type: "patch", catalogRel: currentRel, articleRelPath: currentArticlePath };
	}

	return { type: "ignore" };
}
