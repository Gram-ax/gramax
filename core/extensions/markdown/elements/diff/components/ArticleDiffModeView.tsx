import DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInput";
import { DiffModeView } from "@ext/markdown/elements/diff/components/DiffModeView";
import { EditorContext } from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { JSONContent } from "@tiptap/core";
import { useEffect, useState } from "react";

interface ArticleDiffModeViewProps {
	oldEditTree: JSONContent;
	newEditTree: JSONContent;
	oldContent: string;
	newContent: string;
	changeType: FileStatus;
	articlePath: string;
	readOnly?: boolean;
	onWysiwygUpdate?: (editorContext: EditorContext) => void;
	onMonacoUpdate?: (value: string) => void;
	onViewModeChange?: (viewMode: "wysiwyg" | "markdown") => void;
}

const ArticleDiffModeView = (props: ArticleDiffModeViewProps) => {
	const {
		oldEditTree,
		newEditTree,
		oldContent,
		newContent,
		changeType,
		articlePath,
		readOnly,
		onWysiwygUpdate,
		onMonacoUpdate,
		onViewModeChange,
	} = props;

	const [viewMode, setViewMode] = useState<"wysiwyg" | "markdown">("wysiwyg");

	useEffect(() => {
		const keydownHandler = (e: KeyboardEvent) => {
			if (e.code === "KeyS" && (e.ctrlKey || e.metaKey) && e.altKey) {
				const newValue = viewMode === "wysiwyg" ? "markdown" : "wysiwyg";
				setViewMode(newValue);
				onViewModeChange?.(newValue);
			}
		};

		document.addEventListener("keydown", keydownHandler);
		return () => {
			document.removeEventListener("keydown", keydownHandler);
		};
	}, [viewMode]);

	return (
		<div>
			{viewMode === "wysiwyg" && (
				<div className="article-body">
					<DiffModeView
						readOnly={readOnly}
						key={articlePath}
						oldContent={oldEditTree}
						newContent={newEditTree}
						changeType={changeType}
						articlePath={articlePath}
						onUpdate={onWysiwygUpdate}
					/>
				</div>
			)}
			{viewMode === "markdown" && (
				<DiffFileInput
					modified={newContent}
					original={oldContent}
					height={"90vh"}
					onChange={(value) => {
						onMonacoUpdate?.(value);
					}}
					options={{ readOnly: readOnly }}
				/>
			)}
		</div>
	);
};

export default ArticleDiffModeView;
