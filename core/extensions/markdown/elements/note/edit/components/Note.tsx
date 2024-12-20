import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useRef, useState } from "react";
import Note from "../../render/component/Note";
import BlockActionPanel from "@components/BlockActionPanel";
import NoteMenuActions from "@ext/markdown/elements/note/edit/components/NoteMenuActions";
import NoteHeadEditor from "@ext/markdown/elements/note/edit/components/NoteHeadEditor";
import useWatch from "@core-ui/hooks/useWatch";

const EditNote = ({ node, getPos, updateAttributes, editor }: NodeViewProps): ReactElement => {
	const isEditable = editor.isEditable;
	const hoverElementRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLInputElement>(null);
	const [showHeadEditor, setShowHeadEditor] = useState(isEditable && node.attrs.title?.length > 0);

	useWatch(() => {
		if (showHeadEditor && node.attrs?.title?.length > 0) return;
		setShowHeadEditor(false);
	}, [node.attrs?.title]);

	const onChange = (value: string) => {
		updateAttributes({ title: value });
	};

	return (
		<NodeViewWrapper ref={hoverElementRef}>
			<BlockActionPanel
				getPos={getPos}
				updateAttributes={updateAttributes}
				hoverElementRef={hoverElementRef}
				rightActions={
					isEditable && (
						<NoteMenuActions
							editor={editor}
							node={node}
							getPos={getPos}
							updateAttributes={updateAttributes}
							setShowHeadEditor={setShowHeadEditor}
							showHeadEditor={showHeadEditor}
							titleRef={titleRef}
						/>
					)
				}
			>
				<Note
					{...node.attrs}
					titleEditor={
						showHeadEditor && (
							<NoteHeadEditor
								editor={editor}
								getPos={getPos}
								ref={titleRef}
								autoFocus={node.attrs.title?.length === 0}
								defaultValue={node.attrs.title}
								onChange={onChange}
							/>
						)
					}
				>
					<NodeViewContent className="content" />
				</Note>
			</BlockActionPanel>
		</NodeViewWrapper>
	);
};
export default EditNote;
