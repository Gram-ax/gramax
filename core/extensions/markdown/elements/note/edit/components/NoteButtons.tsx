import ButtonsLayout from "@components/Layouts/ButtonLayout";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";
import { Dispatch, memo } from "react";
import { noteIcons, NoteType } from "../../render/component/Note";

const Note = ({
	editor,
	type,
	setType,
	title,
}: {
	editor: Editor;
	type: NoteType;
	setType: Dispatch<any>;
	title: string;
	className?: string;
}) => {
	return (
		<ButtonsLayout>
			{Object.values(NoteType).map((value, key) => (
				<Button
					icon={noteIcons[value]}
					iconStyle={{ color: `var(--color-admonition-${value}-br-h)` }}
					key={key}
					onClick={() => {
						setType(value);
						editor.chain().focus().updateNote({ type: value, title }).run();
					}}
					isActive={value === type}
				/>
			))}
		</ButtonsLayout>
	);
};

export default memo(Note);
