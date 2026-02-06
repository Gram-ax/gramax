import BlockActionPanel from "@components/BlockActionPanel";
import useWatch from "@core-ui/hooks/useWatch";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import NoteHeadEditor from "@ext/markdown/elements/note/edit/components/NoteHeadEditor";
import NoteMenuActions from "@ext/markdown/elements/note/edit/components/NoteMenuActions";
import { NodeViewContent, NodeViewProps } from "@tiptap/react";
import { ReactElement, useRef, useState } from "react";
import Note from "../../render/component/Note";

const EditNote = (props: NodeViewProps): ReactElement => {
	const { node, getPos, updateAttributes, editor } = props;
	const isEditable = editor.isEditable;
	const hoverElementRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLInputElement>(null);
	const [showHeadEditor, setShowHeadEditor] = useState(isEditable && node.attrs.title?.length > 0);

	const onChange = (value: string) => {
		updateAttributes({ title: value });
	};

	useWatch(() => {
		setShowHeadEditor(isEditable && node.attrs.title?.length > 0);
	}, [node.attrs.title]);

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
							setShowHeadEditor={setShowHeadEditor}
							showHeadEditor={showHeadEditor}
							titleRef={titleRef}
							updateAttributes={updateAttributes}
						/>
					)
				}
				updateAttributes={updateAttributes}
			>
				<Note
					{...node.attrs}
					titleEditor={
						showHeadEditor
							? (expanded: boolean) => (
									<NoteHeadEditor
										autoFocus={node.attrs.title?.length === 0}
										defaultValue={node.attrs.title}
										editor={editor}
										expanded={expanded}
										getPos={getPos}
										nodeSize={node.nodeSize}
										onChange={onChange}
										ref={titleRef}
									/>
								)
							: null
					}
				>
					<NodeViewContent className="content" />
				</Note>
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};
export default EditNote;
