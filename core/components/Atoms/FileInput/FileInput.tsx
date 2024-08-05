import resolveModule from "@app/resolveModule/frontend";
import { FileInputProps } from "@components/Atoms/FileInput/FileInputProps";
import getCodeLensDefaultText from "@components/Atoms/FileInput/getCodeLenseDefaultText";
import getFileInputDefaultLanguage from "@components/Atoms/FileInput/getFileInputDefaultLanguage";
import MergeConflictStyles from "@ext/git/actions/MergeConflictHandler/Monaco/components/MergeConflictStyles";
import FileInputMergeConflict from "@ext/git/actions/MergeConflictHandler/Monaco/logic/FileInputMergeConflict";
import t from "@ext/localization/locale/translate";
import { useEffect, useRef, useState } from "react";
import Theme from "../../../extensions/Theme/Theme";
import ThemeService from "../../../extensions/Theme/components/ThemeService";

const DEFAULT_LANGAUGE = getFileInputDefaultLanguage();

const FileInput = ({ value, language, onChange, onMount, options, height = "60vh", ...props }: FileInputProps) => {
	const readOnly = options?.readOnly ?? false;
	const theme = ThemeService.value;
	const ref = useRef<HTMLDivElement>(null);
	const [editorHeight, setEditorHeight] = useState(0);
	const fileInputMergeConflict = useRef<FileInputMergeConflict>(null);
	const FileInput = resolveModule("FileInput");

	useEffect(() => {
		setEditorHeight(ref.current.getBoundingClientRect().height);
		return () => {
			fileInputMergeConflict.current?.onUnmount();
		};
	}, []);

	return (
		<div style={{ padding: "1rem 0", height }}>
			<div ref={ref} style={{ height: "100%" }}>
				<MergeConflictStyles style={{ height: "100%" }}>
					<FileInput
						height={editorHeight}
						language={language}
						defaultLanguage={DEFAULT_LANGAUGE}
						defaultValue={value}
						onChange={(value, e) => {
							fileInputMergeConflict.current?.onChange();
							onChange?.(value, e, fileInputMergeConflict.current);
						}}
						options={{
							readOnlyMessage: { value: t("cant-edit-this-line") },
							unicodeHighlight: { ambiguousCharacters: false },
							wordWrap: "on",
							...options,
						}}
						theme={theme == Theme.dark ? "vs-dark" : "light"}
						onMount={(editor, monaco) => {
							if (readOnly) {
								onMount?.(editor, monaco, null);
								return;
							}
							fileInputMergeConflict.current = new FileInputMergeConflict(
								editor,
								monaco,
								language || DEFAULT_LANGAUGE,
								getCodeLensDefaultText(),
								theme,
							);
							onMount?.(editor, monaco, fileInputMergeConflict.current);
						}}
						{...props}
					/>
				</MergeConflictStyles>
			</div>
		</div>
	);
};

export default FileInput;
