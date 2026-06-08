import t from "@ext/localization/locale/translate";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import type TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";
import Tabs from "@ext/markdown/elements/tabs/render/component/Tabs";
import { useUpdateNodeProperty } from "@ext/properties/logic/hooks/useUpdateNodeProperty";
import type { PropertyID } from "@ext/properties/models";
import { TextSelection } from "@tiptap/pm/state";
import { NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { type ReactElement, useCallback } from "react";

const EditTabs = (props: NodeViewProps): ReactElement => {
	const { node, editor, getPos, updateAttributes, deleteNode } = props;
	const tabText = t("editor.tabs.name");

	const { update: updateNodeProperty, remove: removeNodeProperty } = useUpdateNodeProperty();

	const onDeleteClick = useCallback(() => {
		deleteNode();
	}, [deleteNode]);

	const onNameUpdate = useCallback(
		(value: string, idx: number) => {
			const childAttrs: TabAttrs[] = node.attrs.childAttrs.map((a) => ({ ...a }));
			childAttrs[idx].name = value.replace("\n", "");
			updateAttributes({ childAttrs });
		},
		[node, updateAttributes],
	);

	const onAddClick = useCallback(() => {
		const childAttrs = node.attrs.childAttrs.map((a) => ({ ...a }));
		const attrs = { name: tabText, idx: node.attrs.childAttrs.length };
		childAttrs.push(attrs);

		const position =
			getPos() + node.nodeSize > editor.state.doc.content.size
				? editor.state.doc.content.size
				: getPos() + node.nodeSize - 1;

		editor.chain().focus(position).setTab(position, attrs).updateAttributes(node.type, { childAttrs }).run();
	}, [node, editor, getPos, tabText]);

	const updateChildAttrs = useCallback(
		(removeIdx: number, childAttrs: TabAttrs[]) => {
			const tr = editor.view.state.tr;
			tr.setNodeAttribute(getPos(), "childAttrs", childAttrs);

			let childPos = getPos() + 1;
			let offset = 0;
			for (let i = 0; i < node.childCount; i++) {
				const child = node.child(i);
				if (i === removeIdx) {
					tr.delete(childPos, childPos + child.nodeSize);
					offset += 1;
				} else {
					tr.setNodeAttribute(childPos, "idx", i === 0 ? 0 : i - offset);
					childPos += child.nodeSize;
				}
			}

			const firstChild = tr.doc.resolve(getPos() + 1);
			const position = getPos() + firstChild.parent.nodeSize;

			tr.setSelection(TextSelection.create(tr.doc, position));
			editor.view.dispatch(tr);
		},
		[node, editor, getPos],
	);

	const onRemoveClick = useCallback(
		(removeIdx: number) => {
			const childAttrs: TabAttrs[] = node.attrs.childAttrs
				.map((a) => ({ ...a }))
				.filter((a) => a.idx !== removeIdx);
			childAttrs.forEach((attrs, idx) => {
				attrs.idx = idx;
			});

			if (childAttrs.length === 0) editor.commands.deleteRange({ from: getPos(), to: getPos() + node.nodeSize });
			else updateChildAttrs(removeIdx, childAttrs);
		},
		[node, editor, getPos, updateChildAttrs],
	);

	const getChildPos = useCallback(
		(index: number) => {
			let childPos = getPos() + 1;

			const clampNodePos = Math.max(Math.min(getPos(), editor.state.doc.content.size), 0);
			const node = editor.state.doc.nodeAt(clampNodePos);
			if (!node) return 0;

			node.forEach((child, _, childIndex) => {
				if (index !== childIndex && childIndex < index) {
					childPos += child.nodeSize;
				}
			});

			return childPos;
		},
		[editor, getPos],
	);

	const onPropertyAdd = useCallback(
		(index: number, property: PropertyID, value?: string) => {
			const childPos = getChildPos(index);
			const childNode = editor.state.doc.nodeAt(childPos);
			if (!childNode) return;

			updateNodeProperty({ pos: childPos, property, value, properties: childNode.attrs.property || [] });
		},
		[editor, getChildPos, updateNodeProperty],
	);

	const onPropertyDelete = useCallback(
		(index: number, property: PropertyID) => {
			const childPos = getChildPos(index);
			const childNode = editor.state.doc.nodeAt(childPos);
			if (!childNode) return;

			removeNodeProperty({ pos: childPos, property, properties: childNode.attrs.property || [] });
		},
		[editor, getChildPos, removeNodeProperty],
	);

	const getTabProperties = useCallback(
		(index: number) => {
			return editor.state.doc.nodeAt(getChildPos(index))?.attrs?.property || [];
		},
		[editor, getChildPos],
	);

	return (
		<NodeViewContextableWrapper props={props}>
			<div className="flex flex-col">
				<Tabs
					childAttrs={node.attrs.childAttrs}
					getTabProperties={getTabProperties}
					isEdit
					onAddClick={onAddClick}
					onDeleteClick={onDeleteClick}
					onNameUpdate={onNameUpdate}
					onPropertyAdd={onPropertyAdd}
					onPropertyDelete={onPropertyDelete}
					onRemoveClick={onRemoveClick}
				>
					<NodeViewContent className="content" />
				</Tabs>
			</div>
		</NodeViewContextableWrapper>
	);
};

export default EditTabs;
