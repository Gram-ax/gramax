import resolveFrontendModule from "@app/resolveModule/frontend";
import type { DiffFileInputProps } from "@components/Atoms/FileInput/DiffFileInput/DiffFileInputProps";
import getFileInputDefaultLanguage from "@components/Atoms/FileInput/getFileInputDefaultLanguage";
import t from "@ext/localization/locale/translate";
import ThemeService from "@ext/Theme/components/ThemeService";
import Theme from "@ext/Theme/Theme";
import { useLayoutEffect, useRef, useState } from "react";

const DEFAULT_LANGAUGE = getFileInputDefaultLanguage();

const DiffFileInput = (props: DiffFileInputProps) => {
	const { language, className, height = "60vh", options, onChange, onMount, containerStyles, ...otherProps } = props;
	const theme = ThemeService.value;
	const ref = useRef<HTMLDivElement>(null);
	const [editorHeight, setEditorHeight] = useState(0);
	const DiffFileInput = resolveFrontendModule("DiffFileInput");

	useLayoutEffect(() => {
		setEditorHeight(ref.current.getBoundingClientRect().height);
	}, []);

	return (
		<div className={className} style={{ padding: "1rem 0", height, ...containerStyles }}>
			<div ref={ref} style={{ height: "100%" }}>
				<DiffFileInput
					height={editorHeight}
					modifiedLanguage={language ?? DEFAULT_LANGAUGE}
					onMount={(editor, monaco) => {
						onMount?.(editor, monaco);
						const modifiedEditor = editor.getModifiedEditor();
						modifiedEditor.onDidChangeModelContent(() => {
							onChange?.(modifiedEditor.getModel().getValue());
						});
					}}
					options={{
						unusualLineTerminators: "off",
						readOnlyMessage: { value: t("cant-edit-this-line") },
						unicodeHighlight: { ambiguousCharacters: false },
						wordWrap: "on",
						...options,
					}}
					originalLanguage={language ?? DEFAULT_LANGAUGE}
					theme={theme == Theme.dark ? "vs-dark" : "light"}
					{...otherProps}
				/>
			</div>
		</div>
	);
};

export default DiffFileInput;
