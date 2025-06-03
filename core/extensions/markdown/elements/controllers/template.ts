import { Plugin, PluginKey, Transaction } from "prosemirror-state";
import { Extension } from "@tiptap/core";
import selectionRule from "@ext/markdown/elements/controllers/rules/selectionRule";
import nodeRule from "@ext/markdown/elements/controllers/rules/nodeRule";

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

			return null;
		},
	});
}

export default template;
