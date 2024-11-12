import { getSchema } from "@ext/markdown/core/edit/logic/Prosemirror/schema";
import diffItemSchema from "@ext/markdown/elements/diff/edit/model/diffItemSchema";
import astToDiffAst from "@ext/markdown/elements/diff/logic/astToDiffAst";
import getDecoratorsFromDiffNode from "@ext/markdown/elements/diff/logic/getDecoratorsFromDiffNode";
import getDiffNodes from "@ext/markdown/elements/diff/logic/getDiffDecorators";
import { Editor } from "@tiptap/react";
import { Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";

const diffAddedPluginKey = new PluginKey("diff-added");
const diffRemovedPluginKey = new PluginKey("diff-removed");
const changeContextPluginKey = new PluginKey("diff-changed-context");

const diffSchema = { nodes: { diff_item: diffItemSchema } };
const schema = getSchema(diffSchema);

const showDiffs = (oldEditor: Editor, newEditor: Editor): void => {
	const oldDoc = astToDiffAst(oldEditor.state.doc.toJSON());
	const newDoc = astToDiffAst(newEditor.state.doc.toJSON());

	const oldNode = Node.fromJSON(schema, oldDoc.diffDoc);
	const newNode = Node.fromJSON(schema, newDoc.diffDoc);
	const diffNodes = getDiffNodes(oldNode, oldDoc.paths, newNode, newDoc.paths);
	const { addedDecorations, removedDecorations, changedContextDecorations } = getDecoratorsFromDiffNode(
		oldEditor.state.doc,
		newEditor.state.doc,
		diffNodes,
	);
	const addedDecorationSet = DecorationSet.create(newEditor.state.doc, addedDecorations);
	const changedContextDecorationSet = DecorationSet.create(newEditor.state.doc, changedContextDecorations);
	const removedDecorationSet = DecorationSet.create(oldEditor.state.doc, removedDecorations);

	const addedPlugin = new Plugin({
		key: diffAddedPluginKey,
		props: {
			decorations() {
				return addedDecorationSet;
			},
		},
	});
	const changeContextPlugin = new Plugin({
		key: changeContextPluginKey,
		props: {
			decorations() {
				return changedContextDecorationSet;
			},
		},
	});
	const currentPlugins = newEditor.view.state.plugins;
	const filteredPlugins = currentPlugins.filter(
		(p) => p.spec?.key !== diffAddedPluginKey && p.spec?.key !== changeContextPluginKey,
	);
	const newState = newEditor.view.state.reconfigure({
		plugins: [...filteredPlugins, addedPlugin, changeContextPlugin],
	});
	newEditor.view.updateState(newState);

	const removedPlugin = new Plugin({
		key: diffRemovedPluginKey,
		props: {
			decorations() {
				return removedDecorationSet;
			},
		},
	});
	const currentPlugins2 = oldEditor.view.state.plugins;
	const filteredPlugins2 = currentPlugins2.filter((p) => p.spec?.key !== diffRemovedPluginKey);
	const newState2 = oldEditor.view.state.reconfigure({
		plugins: [...filteredPlugins2, removedPlugin],
	});
	oldEditor.view.updateState(newState2);
};

export default showDiffs;
