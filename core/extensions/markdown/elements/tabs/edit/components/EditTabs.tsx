import styled from "@emotion/styled";
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
		const attrs = { name: "name", idx: node.attrs.childAttrs.length };
		childAttrs.push(attrs);

		editor
			.chain()
			.focus(getPos() + node.nodeSize - 1)
			.setTab(attrs)
			.updateAttributes(node.type, { childAttrs })
			.focus(getPos() + node.nodeSize - 1)
			.run();
	}, [node]);

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
	margin-left: -5px;
	padding-left: 5px;
	margin-right: -5px;
	padding-right: 5px;
	border: 1px dashed #ffffff0f;

	&.no-hover:hover {
		border: 1px dashed #ffffff0f;
	}

	:hover,
	&.hover {
		border: 1px dashed var(--color-line);
		border-radius: var(--radius-small);
	}
`;
