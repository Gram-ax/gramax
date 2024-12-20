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
}

const NoteHeadEditor = forwardRef((props: NoteHeadEditorProps, ref: RefObject<HTMLInputElement>) => {
	const { editor, getPos, onChange, defaultValue, autoFocus = true } = props;

	const onKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") return editor.commands.focus(getPos(), { scrollIntoView: false });
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
			ref={ref}
			onKeyUp={onKeyUp}
			autoFocus={autoFocus}
			placeholder={t("title")}
			className="title-editor"
			onChange={preChange}
			defaultValue={defaultValue}
			onBlur={onLoseFocus}
		/>
	);
});

export default NoteHeadEditor;
