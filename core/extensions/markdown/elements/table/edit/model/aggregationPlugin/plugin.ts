import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";

const pluginKey = new PluginKey("aggregation$");
const aggregationPlugin = new Plugin({
	key: pluginKey,
	appendTransaction(transactions, oldState, newState) {
		let newTransaction: Transaction = null;

		transactions.forEach((transaction) => {
			if (newTransaction) return;
			if (!transaction.docChanged) return;
			if (transaction.steps.length !== 1) return;

			const data = getFocusNode(newState, (node) => {
				return node.type === newState.schema.nodes.table;
			});

			if (!data?.position || !data?.node) return;
			if (oldState.doc.content.size < data.position) return;
			const oldTable = oldState.doc.nodeAt(data.position);

			if (!oldTable || oldTable.type !== data.node.type) return;
			if (oldTable.childCount === data.node.childCount) return;
			if (oldTable.firstChild === data.node.firstChild) return;

			const tr = newState.tr;
			transaction.steps.forEach((step) => {
				if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
					const { from, to } = step;
					const sliceSizeChange = step.slice.size - (to - from);

					if (sliceSizeChange === 0) return;
					let newPos = data.position + 2;
					let oldPos = data.position + 2 + data.node.firstChild.nodeSize;

					data.node.firstChild.forEach((child, _, index) => {
						const oldCell = data.node.maybeChild(1)?.maybeChild(index);

						if (oldCell?.attrs?.aggregation && oldCell.attrs.aggregation !== child.attrs.aggregation) {
							tr.setNodeMarkup(newPos, child.type, { aggregation: oldCell.attrs.aggregation });
							tr.setNodeMarkup(oldPos, oldCell.type, { aggregation: null });
						}

						newPos += child.nodeSize;
						oldPos += data.node.maybeChild(1)?.maybeChild(index)?.nodeSize;
					});
				}
			});

			newTransaction = tr;
		});

		return newTransaction;
	},
});

export default aggregationPlugin;
