import { combineTransactionSteps, getChangedRanges, getMarksBetween } from "@tiptap/core";
import type { MarkType } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";

export function syncLinkText(options: { type: MarkType }): Plugin {
	return new Plugin({
		key: new PluginKey("syncLinkText"),
		appendTransaction: (transactions, oldState, newState) => {
			if (!transactions.some((tr) => tr.docChanged)) {
				return;
			}

			const tr = newState.tr;
			const transform = combineTransactionSteps(oldState.doc, [...transactions]);
			let hasChanges = false;

			getChangedRanges(transform).forEach(({ oldRange }) => {
				getMarksBetween(oldRange.from, oldRange.to, oldState.doc)
					.filter((item) => item.mark.type === options.type)
					.forEach((oldMark) => {
						const newFrom = transform.mapping.map(oldMark.from);
						const newTo = transform.mapping.map(oldMark.to);

						const oldText = oldState.doc.textBetween(oldMark.from, oldMark.to);
						const newText = newState.doc.textBetween(newFrom, newTo);

						if (oldText !== newText) {
							const currentHref = oldMark.mark.attrs.href || "";
							const currentResourcePath = oldMark.mark.attrs.resourcePath || "";

							const wasExternal = /^https?:\/\//.test(oldText);
							const isExternal = /^https?:\/\//.test(newText);

							if (wasExternal && !isExternal) {
								return;
							}

							// Only sync if text and href were already in sync
							// If they differ, user manually set a different href, so skip syncing
							const wereInSync = oldText === currentHref || oldText === currentResourcePath;

							if (!wereInSync) {
								return;
							}

							if (/^https?:\/\/?$/i.test(newText)) {
								return;
							}
							tr.removeMark(newFrom, newTo, options.type);
							tr.addMark(
								newFrom,
								newTo,
								options.type.create({
									...oldMark.mark.attrs,
									href: newText,
									resourcePath: newText,
								}),
							);
							hasChanges = true;
						}
					});
			});

			return hasChanges ? tr : undefined;
		},
	});
}
