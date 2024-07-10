import resolveModule from "@app/resolveModule/frontend";
import { FileInputProps } from "@components/Atoms/FileInput/FileInputProps";
import getFileInputDefaultLanguage from "@components/Atoms/FileInput/getFileInputDefaultLanguage";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import MergeConflictStyles from "@ext/git/actions/MergeConflictHandler/Monaco/components/MergeConflictStyles";
import FileInputMergeConflict, {
	CodeLensText,
} from "@ext/git/actions/MergeConflictHandler/Monaco/logic/FileInputMergeConflict";
import Language from "@ext/localization/core/model/Language";
import useLocalize from "@ext/localization/useLocalize";
import useBareLocalize from "@ext/localization/useLocalize/useBareLocalize";
import { useEffect, useRef, useState } from "react";
import Theme from "../../../extensions/Theme/Theme";
import ThemeService from "../../../extensions/Theme/components/ThemeService";

const DEFAULT_LANGAUGE = getFileInputDefaultLanguage();

const getCodeLensDefaultText = (lang: Language): CodeLensText => {
	return {
		acceptCurrent: useBareLocalize("acceptCurrentChange", lang),
		acceptIncoming: useBareLocalize("acceptIncomingChange", lang),
		mergeWithDeletionHeader: useBareLocalize("defaultMergeWithDeletionText", lang),
		deleteFile: useBareLocalize("delete", lang),
		leaveFile: useBareLocalize("leave", lang),
		mergeWithDeletionFileContent: useBareLocalize("fileContent", lang),
	};
};

const FileInput = ({ value, language, onChange, onMount, options, height = "60vh", ...props }: FileInputProps) => {
	const readOnly = options?.readOnly ?? false;
	const theme = ThemeService.value;
	const lang = PageDataContextService.value.lang;
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
						options={{ readOnlyMessage: { value: useLocalize("cantEditThisLine") }, ...options }}
						theme={theme == Theme.dark ? "vs-dark" : "light"}
						onMount={(editor, monaco) => {
							if (readOnly) {
								onMount?.(editor, monaco, null);
								return;
							}
							fileInputMergeConflict.current = new FileInputMergeConflict(
								editor,
								monaco,
								language ?? DEFAULT_LANGAUGE,
								getCodeLensDefaultText(lang),
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
