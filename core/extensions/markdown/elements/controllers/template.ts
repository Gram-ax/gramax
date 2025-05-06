import { Plugin, PluginKey, Selection, TextSelection, Transaction } from "prosemirror-state";
import { Extension } from "@tiptap/core";
import selectionRule from "@ext/markdown/elements/controllers/rules/selectionRule";
import nodeRule from "@ext/markdown/elements/controllers/rules/nodeRule";
import { ReplaceStep } from "@tiptap/pm/transform";
import checkBlockField from "@ext/markdown/elements/controllers/helpers/checkBlockField";

const validateRules = (transaction: Transaction, ...rules: ((transaction: Transaction) => boolean)[]): boolean => {
	return rules.every((rule) => {
		const result = rule(transaction);

		if (result === undefined) {
			return true;
		}

		return result;
	});
};

function template(this: Extension) {
	return new Plugin({
		key: new PluginKey("$template-controller"),
		view: (view) => {
			return {
				update: () => {
					this.options.editable && view.dom.setAttribute("is-template", "true");
				},
				destroy: () => {
					this.options.editable && view.dom.removeAttribute("is-template");
				},
			};
		},
		filterTransaction: (transaction) => {
			if (!this.options.editable) {
				return true;
			}

			const ignoreFilterController =
				transaction.getMeta("blur") || transaction.getMeta("ignore-filter-controller");
			if (ignoreFilterController) {
				return true;
			}

			return validateRules(transaction, nodeRule, selectionRule);
		},
		appendTransaction: (transactions, oldState, newState) => {
			if (!this.options.editable) {
				return null;
			}

			const hasFocusTransactions = transactions.some((transaction) => transaction.getMeta("focus"));
			if (hasFocusTransactions) {
				return newState.tr.setMeta("ignore-filter-controller", true);
			}

			for (const transaction of transactions) {
				for (const step of transaction.steps) {
					if (!(step instanceof ReplaceStep)) continue;

					const mapResult = step.getMap().mapResult(step.from);
					const clampedPos = Math.max(Math.min(mapResult.pos, oldState.doc.content.size), 0);
					if (!mapResult.deleted && !checkBlockField(TextSelection.create(oldState.doc, clampedPos)))
						continue;

					const node = oldState.doc.nodeAt(clampedPos);
					if (!node || node.isTextblock || node.childCount || !node.isBlock) continue;

					return newState.tr.setSelection(Selection.near(newState.doc.resolve(clampedPos - 1), -1));
				}
			}

			return null;
		},
	});
}

export default template;
