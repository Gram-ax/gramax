import Icon from "@components/Atoms/Icon";
import BlockActionPanel from "@components/BlockActionPanel";
import { classNames } from "@components/libs/classNames";
import useWatch from "@core-ui/hooks/useWatch";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import NoteMenuActions from "@ext/markdown/elements/note/edit/components/NoteMenuActions";
import { NoteType, noteIcons } from "@ext/markdown/elements/note/render/component/Note";
import { NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { type MouseEvent, type ReactElement, useRef, useState } from "react";

const EditNote = (props: NodeViewProps): ReactElement => {
	const { node, getPos, updateAttributes, editor } = props;
	const isEditable = editor.isEditable;
	const hoverElementRef = useRef<HTMLDivElement>(null);
	const type = (node.attrs.type as NoteType) || NoteType.note;
	const collapsed = !!node.attrs.collapsed;
	const [expanded, setExpanded] = useState(!collapsed);
	const clickable = !expanded || collapsed;

	useWatch(() => {
		setExpanded(!collapsed);
	}, [collapsed]);

	const toggleExpanded = (e: MouseEvent<HTMLElement>) => {
		e.preventDefault();
		setExpanded((prev) => !prev);
	};

	return (
		<NodeViewContextableWrapper props={props} ref={hoverElementRef}>
			<BlockActionPanel
				getPos={getPos}
				hoverElementRef={hoverElementRef}
				rightActions={
					isEditable && (
						<NoteMenuActions
							editor={editor}
							getPos={getPos}
							node={node}
							updateAttributes={updateAttributes}
						/>
					)
				}
				updateAttributes={updateAttributes}
			>
				<div
					className={classNames("admonition", { "admonition-collapsed": collapsed && !expanded }, [
						`admonition-${type}`,
						"admonition-row",
					])}
					data-component="note"
				>
					<div className="admonition-heading" contentEditable={false} suppressContentEditableWarning={true}>
						<div
							className={classNames("admonition-icon", { clickable })}
							onClick={clickable ? toggleExpanded : null}
						>
							<Icon
								code={clickable ? (expanded ? "chevron-down" : "chevron-right") : noteIcons[type]}
								strokeWidth="2"
							/>
						</div>
					</div>
					<NodeViewContent className="admonition-content" />
				</div>
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};

export default EditNote;
