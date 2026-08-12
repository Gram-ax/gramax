import DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInput";
import FileInput from "@components/Atoms/FileInput/FileInput";
import useMonacoLinesRestriction from "@components/Atoms/FileInput/hooks/useMonacoLinesRestriction";
import { useRouter } from "@core/Api/useRouter";
import type { EditorContext } from "@core-ui/stores/EditorStore";
import { DiffModeView } from "@ext/git/core/Diff/components/DiffModeView";
import { setDisabledDoublePanel, setIsDoublePanel } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { useDiffMode } from "@ext/git/core/Diff/logic/hooks/useDiffMode";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { JSONContent } from "@tiptap/core";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

interface ArticleDiffModeViewProps {
	oldEditTree: JSONContent;
	newEditTree: JSONContent;
	oldContent: string;
	newContent: string;
	changeType: FileStatus;
	articlePath: string;
	oldArticlePath?: string;
	oldScope?: TreeReadScope;
	newScope?: TreeReadScope;
	readOnly?: boolean;
	onWysiwygUpdate?: (editorContext: EditorContext) => void;
	onMonacoUpdate?: (value: string) => void;
	onViewModeChange?: () => void;
}

const ArticleDiffModeView = (props: ArticleDiffModeViewProps) => {
	const {
		oldEditTree,
		newEditTree,
		oldContent,
		newContent,
		changeType,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		articlePath,
		oldArticlePath,
		oldScope,
		newScope,
		readOnly,
		onWysiwygUpdate,
		onMonacoUpdate,
		onViewModeChange,
	} = props;

	const router = useRouter();
	const applyLinesRestrictionRef = useRef<() => void>(null);
	const applyLinesRestriction = useMonacoLinesRestriction(
		useMemo(
			() => [
				{
					startLineNumber: 1,
					startColumn: 1,
					endLineNumber: 4,
					endColumn: Number.MAX_SAFE_INTEGER,
				},
			],
			[],
		),
	);

	const isAdded = changeType === FileStatus.new;
	const isDeleted = changeType === FileStatus.delete;
	const hasEditTree = (() => {
		if (isDeleted) return !!oldEditTree;
		if (isAdded) return !!newEditTree;
		if (changeType === FileStatus.current) return true;
		return !!oldEditTree && !!newEditTree;
	})();

	const { isDoublePanel, isMarkdown, isWysiwyg } = useDiffMode();

	// biome-ignore lint/correctness/useExhaustiveDependencies: router.pushQuery is stable
	useLayoutEffect(() => {
		if (!hasEditTree && isWysiwyg) {
			router.pushQuery({ mode: "markdown" });
		}

		setDisabledDoublePanel(!hasEditTree || isDeleted || isAdded);

		return () => {
			setDisabledDoublePanel(false);
		};
	}, [hasEditTree, isDeleted, isAdded, isWysiwyg]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		onViewModeChange?.();
	}, [isDoublePanel, isMarkdown]);

	useEffect(() => {
		if (isDeleted || isAdded) setIsDoublePanel(false);
	}, [isDeleted, isAdded]);

	useEffect(() => {
		return () => {
			applyLinesRestrictionRef.current?.();
		};
	}, []);

	return (
		<div style={{ height: "inherit" }}>
			{isWysiwyg && hasEditTree && (
				<div className="article-body" style={{ height: "inherit" }}>
					<DiffModeView
						articlePath={articlePath}
						changeType={changeType}
						key={articlePath}
						newContent={newEditTree}
						newScope={newScope}
						oldArticlePath={oldArticlePath}
						oldContent={oldEditTree}
						oldScope={oldScope}
						onUpdate={onWysiwygUpdate}
						readOnly={readOnly}
					/>
				</div>
			)}
			{isMarkdown && (
				<div className="w-full h-full">
					<div className="h-full w-[var(--article-content-wrapper-width)] ml-[calc((var(--article-content-wrapper-width)-100%)/-2)]">
						{isDeleted || isAdded ? (
							<FileInput
								height={"85dvh"}
								onMount={(editor) => {
									// https://github.com/microsoft/monaco-editor/issues/4448
									editor.updateOptions({ glyphMargin: false });
								}}
								options={{
									readOnly: isDeleted || readOnly,
									glyphMargin: false,
								}}
								style={{ padding: "0" }}
								theme={{ dark: "new-vs-dark", light: "light" }}
								value={isAdded ? newContent : oldContent}
							/>
						) : (
							<DiffFileInput
								containerStyles={{ padding: "0" }}
								height={"85dvh"}
								modified={newContent}
								onChange={(value) => {
									onMonacoUpdate?.(value);
								}}
								onMount={(editor, monaco) => {
									// https://github.com/microsoft/monaco-editor/issues/4448
									editor.getOriginalEditor().updateOptions({ glyphMargin: false });
									applyLinesRestrictionRef.current = applyLinesRestriction(
										editor.getModifiedEditor(),
										monaco,
									);
								}}
								options={{
									readOnly: isDeleted || readOnly,
									renderSideBySide: isDoublePanel,
									useInlineViewWhenSpaceIsLimited: false,
									renderOverviewRuler: false,
									glyphMargin: false,
								}}
								original={oldContent}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default ArticleDiffModeView;
