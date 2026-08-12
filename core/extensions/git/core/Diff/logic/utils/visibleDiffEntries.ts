import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";

/**
 * В упрощённом режиме ресурсы, вложенные в статью, не показываются:
 * строка статьи представляет и саму статью, и её ресурсы.
 */
export const isDiffEntryVisible = (entry: DiffFlattenTreeAnyItem, extendedMode: boolean): boolean =>
	extendedMode || !(entry.type === "resource" && entry.indent > 1);

/** Сколько выбранных строк видит пользователь в текущем режиме отображения. */
export const countSelectedVisibleEntries = (
	changes: DiffFlattenTreeAnyItem[],
	extendedMode: boolean,
	isSelected: (entry: DiffFlattenTreeAnyItem) => boolean,
): number => changes?.filter((entry) => isDiffEntryVisible(entry, extendedMode) && isSelected(entry)).length ?? 0;
