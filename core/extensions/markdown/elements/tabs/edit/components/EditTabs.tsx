import styled from "@emotion/styled";
import useLocalize from "@ext/localization/useLocalize";
import { FocusPositionContext } from "@ext/markdown/core/edit/components/ContextWrapper";
import TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";
import Tabs from "@ext/markdown/elements/tabs/render/component/Tabs";
import { JSONContent, NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useCallback, useContext, useEffect, useState } from "react";

const EditTabs = ({
	node,
	editor,
	className,
	getPos,
	updateAttributes,
}: { className?: string } & NodeViewProps): ReactElement => {
	const tabText = useLocalize("tab");
	const position = useContext(FocusPositionContext);
	const [activeHoverStyle, setActiveHoverStyle] = useState(false);

	useEffect(() => {
		const from = getPos();
		const to = getPos() + node.nodeSize;
		setActiveHoverStyle(from < position && position < to);
	}, [position]);

	const onNameUpdate = useCallback(
		(value: string, idx: number) => {
			const childAttrs: TabAttrs[] = node.attrs.childAttrs.map((a) => ({ ...a }));
			childAttrs[idx].name = value;
			updateAttributes({ childAttrs });
		},
		[node],
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
	}, [node]);

	const onTabEnter = (idx: number) => {
		let offset = 1;
		const child = node.child(idx);
		node.forEach((c, o) => {
			if (c == child) offset = o;
		});
		editor.commands.focus(getPos() + offset + child.nodeSize);
	};

	const onRemoveClick = useCallback(
		(removeIdx: number) => {
			const childAttrs: TabAttrs[] = node.attrs.childAttrs
				.map((a) => ({ ...a }))
				.filter((a) => a.idx !== removeIdx);
			childAttrs.forEach((attrs, idx) => (attrs.idx = idx));

			const json: JSONContent = node.toJSON();
			json.attrs = { childAttrs };
			json.content = json.content
				.filter((node) => node.attrs.idx !== removeIdx)
				.map((node, idx) => {
					node.attrs.idx = idx;
					return node;
				});

			if (json.content.length == 0) editor.commands.deleteNode(node.type);
			else {
				editor
					.chain()
					.deleteNode(node.type)
					.focus(getPos() - 1)
					.run();
				editor
					.chain()
					.insertContent(json)
					.focus(getPos() - 1)
					.run();
			}
		},
		[node],
	);

	return (
		<NodeViewWrapper>
			<Tabs
				isEdit
				onTabEnter={onTabEnter}
				onAddClick={onAddClick}
				onNameUpdate={onNameUpdate}
				onRemoveClick={onRemoveClick}
				childAttrs={node.attrs.childAttrs}
				className={`${className} ${activeHoverStyle ? "hover" : ""}`}
			>
				<NodeViewContent className="content" />
			</Tabs>
		</NodeViewWrapper>
	);
};

export default styled(EditTabs)`
	padding: 4px 8px;
	margin: -4px -8px;
	border: 1px dashed #ffffff0f;

	&.no-hover:hover {
		border: 1px dashed #ffffff0f;
	}

	:hover,
	&.hover {
		border-radius: var(--radius-large);
		border: 1px dashed var(--color-line);
	}
`;
