import Input from "@components/Atoms/Input";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { ChangeEvent, FocusEvent, forwardRef, KeyboardEvent, RefObject } from "react";

interface NoteHeadEditorProps {
	editor: Editor;
	getPos: () => number;
	onChange: (value: string) => void;
	autoFocus?: boolean;
	defaultValue?: string;
	expanded: boolean;
	nodeSize: number;
}

const NoteHeadEditor = forwardRef((props: NoteHeadEditorProps, ref: RefObject<HTMLInputElement>) => {
	const { editor, getPos, onChange, defaultValue, autoFocus = true, expanded, nodeSize } = props;

	const onKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			const pos = getPos();
			const posInNote = expanded ? pos + 1 : pos + nodeSize;
			editor.chain().insertContentAt(posInNote, "<p></p>").focus(posInNote, { scrollIntoView: false }).run();
			return;
		}
		if (e.key === "ArrowDown") return editor.commands.focus(getPos(), { scrollIntoView: false });
	};

	const onLoseFocus = (e: FocusEvent<HTMLInputElement>) => {
		const target = e.target as HTMLInputElement;
		if (target.value.length) return onChange(target.value);

		target.dataset.focus = "true";
		onChange("");
	};

	const preChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value);
	};

	return (
		<Input
			autoFocus={autoFocus}
			className="title-editor"
			defaultValue={defaultValue}
			onBlur={onLoseFocus}
			onChange={preChange}
			onKeyUp={onKeyUp}
			placeholder={t("title")}
			ref={ref}
		/>
	);
});

export default NoteHeadEditor;
