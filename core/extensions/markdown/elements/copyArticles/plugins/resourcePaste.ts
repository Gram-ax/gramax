import type { ResourceServiceType } from "@core-ui/ContextServices/ResourceService/ResourceService";
import type { Node, Slice } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";

const processNode = (childNode: Node, resourceService: ResourceServiceType, notDeletedSrc?: Set<string>) => {
	if (
		!childNode.isText &&
		Object.keys(childNode.attrs).length !== 0 &&
		childNode.attrs.src &&
		!notDeletedSrc.has(childNode.attrs.src)
	) {
		const name = childNode.attrs.src.slice(2);
		void resourceService.setResource(name, resourceService.getBuffer(childNode.attrs.src));
	}

	for (let index = 0; index < childNode.content.childCount; index++) {
		processNode(childNode.content.child(index), resourceService, notDeletedSrc);
	}
};

export const resourcePaste = (transactions: Transaction[], resourceService: ResourceServiceType) => {
	transactions.forEach((tr: Transaction) => {
		const $history = tr.getMeta("history$");
		if (!tr.docChanged || !$history) return;

		const notDeletedSrc = new Set<string>();
		const historyState = $history.historyState;
		const items = $history.redo ? historyState.done.items : historyState.undone.items;
		const values = items?.values || [];

		values.forEach((item) => {
			const slice: Slice = item.step.slice;
			if (!slice?.content?.childCount) return;

			slice.content.forEach((node) => {
				if (!node.attrs.src) return;
				notDeletedSrc.add(node.attrs.src);
			});
		});

		tr.steps.forEach((step) => {
			if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
				step.slice.content.forEach((node: Node) => {
					processNode(node, resourceService, notDeletedSrc);
				});
			}
		});
	});
};
