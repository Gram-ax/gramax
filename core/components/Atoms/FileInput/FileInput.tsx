import resolveModule from "@app/resolveModule/frontend";
import type { FileInputProps } from "@components/Atoms/FileInput/FileInputProps";
import getCodeLensDefaultText from "@components/Atoms/FileInput/getCodeLenseDefaultText";
import getFileInputDefaultLanguage from "@components/Atoms/FileInput/getFileInputDefaultLanguage";
import MergeConflictStyles from "@ext/git/actions/MergeConflictHandler/Monaco/components/MergeConflictStyles";
import FileInputMergeConflict from "@ext/git/actions/MergeConflictHandler/Monaco/logic/FileInputMergeConflict";
import t from "@ext/localization/locale/translate";
import { type CSSProperties, useLayoutEffect, useRef } from "react";
import ThemeService from "../../../extensions/Theme/components/ThemeService";
import Theme from "../../../extensions/Theme/Theme";

const DEFAULT_LANGAUGE = getFileInputDefaultLanguage();

const FileInput = (props: FileInputProps & { style?: CSSProperties; uiKitTheme?: boolean }) => {
	const {
		value,
		style,
		className,
		uiKitTheme,
		language,
		onChange,
		onMount,
		options,
		height = "60vh",
		...otherProps
	} = props;

	const readOnly = options?.readOnly ?? false;
	const theme = ThemeService.value;
	const ref = useRef<HTMLDivElement>(null);
	const fileInputMergeConflict = useRef<FileInputMergeConflict>(null);
	const FileInput = resolveModule("FileInput");

	useLayoutEffect(() => {
		return () => {
			fileInputMergeConflict.current?.onUnmount();
		};
	}, []);

	const monacoDarkTheme = uiKitTheme ? "new-vs-dark" : "vs-dark";

	return (
		<div className={className} style={{ padding: "1rem 0", height, ...style }}>
			<div ref={ref} style={{ height: "100%" }}>
				<MergeConflictStyles style={{ height: "100%" }}>
					<FileInput
						defaultLanguage={DEFAULT_LANGAUGE}
						defaultValue={value}
						height="100%"
						language={language}
						onChange={(value, e) => {
							fileInputMergeConflict.current?.onChange();
							onChange?.(value, e, fileInputMergeConflict.current);
						}}
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
						options={{
							unusualLineTerminators: "off",
							readOnlyMessage: { value: t("cant-edit-this-line") },
							unicodeHighlight: { ambiguousCharacters: false },
							wordWrap: "on",
							...options,
						}}
						theme={theme == Theme.dark ? monacoDarkTheme : "light"}
						{...otherProps}
					/>
				</MergeConflictStyles>
			</div>
		</div>
	);
};

export default FileInput;
