import Input from "@components/Atoms/Input";
import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import { type ChangeEvent, type FocusEvent, forwardRef, type KeyboardEvent, type RefObject, useCallback } from "react";

interface NoteHeadEditorProps {
	editor: Editor;
	getPos: () => number;
	onChange: (value: string) => void;
	autoFocus?: boolean;
	value?: string;
	expanded: boolean;
	nodeSize: number;
}

const NoteHeadEditor = forwardRef((props: NoteHeadEditorProps, ref: RefObject<HTMLInputElement>) => {
	const { editor, getPos, onChange, value, autoFocus = true, expanded, nodeSize } = props;

	const onKeyUp = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				const pos = getPos();
				const posInNote = expanded ? pos + 1 : pos + nodeSize;
				editor.chain().insertContentAt(posInNote, "<p></p>").focus(posInNote, { scrollIntoView: false }).run();
				return;
			}
			if (e.key === "ArrowDown") return editor.commands.focus(getPos(), { scrollIntoView: false });
		},
		[editor, getPos, expanded, nodeSize],
	);

	const onLoseFocus = useCallback(
		(e: FocusEvent<HTMLInputElement>) => {
			const target = e.target as HTMLInputElement;
			if (target.value.length) return onChange(target.value);

			target.dataset.focus = "true";
			onChange("");
		},
		[onChange],
	);

	const preChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			onChange(e.target.value);
		},
		[onChange],
	);

	return (
		<Input
			autoFocus={autoFocus}
			className="title-editor"
			onBlur={onLoseFocus}
			onChange={preChange}
			onKeyUp={onKeyUp}
			placeholder={t("title")}
			ref={ref}
			value={value}
		/>
	);
});

export default NoteHeadEditor;
