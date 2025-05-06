import DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInput";
import DiffViewModeService from "@core-ui/ContextServices/DiffViewModeService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import useSetupRightNavCloseHandler from "@core-ui/hooks/diff/useSetupRightNavCloseHandler";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { DiffViewMode } from "@ext/markdown/elements/diff/components/DiffBottomBar";
import { DiffModeView } from "@ext/markdown/elements/diff/components/DiffModeView";
import RenderDiffBottomBarInArticle from "@ext/markdown/elements/diff/components/RenderDiffBottomBarInArticle";
import { EditorContext } from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { DiffFilePaths } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { JSONContent } from "@tiptap/core";
import { useEffect, useLayoutEffect, useState } from "react";

interface ArticleDiffModeViewProps {
	oldEditTree: JSONContent;
	newEditTree: JSONContent;
	oldContent: string;
	newContent: string;
	changeType: FileStatus;
	articlePath: string;
	oldRevision: string;
	newRevision: string;
	title: string;
	filePath: DiffFilePaths;
	oldArticlePath?: string;
	oldScope?: TreeReadScope;
	newScope?: TreeReadScope;
	readOnly?: boolean;
	onWysiwygUpdate?: (editorContext: EditorContext) => void;
	onMonacoUpdate?: (value: string) => void;
	onViewModeChange?: (diffView: DiffViewMode) => void;
}

const ArticleDiffModeView = (props: ArticleDiffModeViewProps) => {
	const {
		oldRevision,
		newRevision,
		filePath,
		oldEditTree,
		newEditTree,
		oldContent,
		newContent,
		changeType,
		title,
		articlePath,
		oldArticlePath,
		oldScope,
		newScope,
		readOnly,
		onWysiwygUpdate,
		onMonacoUpdate,
		onViewModeChange,
	} = props;

	const hasEditTree = (() => {
		if (changeType === FileStatus.delete) return !!oldEditTree;
		if (changeType === FileStatus.new) return !!newEditTree;
		return !!oldEditTree && !!newEditTree;
	})();

	const diffViewService = DiffViewModeService.value;
	const restoreRightSidebar = useRestoreRightSidebar();
	const [diffView, setDiffView] = useState(diffViewService);

	useLayoutEffect(() => {
		if (!hasEditTree && diffView === "wysiwyg") setDiffView("single-panel");
	}, []);

	useEffect(() => {
		const listener = () => {
			restoreRightSidebar();
			ArticleViewService.setDefaultView();
		};

		const token = NavigationEvents.on("item-click", listener);

		return () => {
			NavigationEvents.off(token);
		};
	}, [restoreRightSidebar]);

	useSetupRightNavCloseHandler();

	const setViewModeWrapper = (mode: DiffViewMode) => {
		setDiffView(mode);
		DiffViewModeService.value = mode;
		onViewModeChange?.(mode);
	};

	return (
		<div style={{ height: "inherit" }}>
			{diffView === "wysiwyg" && hasEditTree && (
				<div className="article-body" style={{ height: "inherit" }}>
					<DiffModeView
						oldScope={oldScope}
						newScope={newScope}
						readOnly={readOnly}
						key={articlePath}
						oldContent={oldEditTree}
						newContent={newEditTree}
						changeType={changeType}
						articlePath={articlePath}
						oldArticlePath={oldArticlePath}
						onUpdate={onWysiwygUpdate}
					/>
				</div>
			)}
			{(diffView === "single-panel" || diffView === "double-panel") && (
				<DiffFileInput
					modified={newContent}
					original={oldContent}
					height={"100vh"}
					containerStyles={{ padding: "0" }}
					onChange={(value) => {
						onMonacoUpdate?.(value);
					}}
					options={{
						readOnly,
						renderSideBySide: diffView === "double-panel",
						useInlineViewWhenSpaceIsLimited: false,
						renderOverviewRuler: false,
						glyphMargin: false,
					}}
					onMount={(editor) => {
						// https://github.com/microsoft/monaco-editor/issues/4448
						editor.getOriginalEditor().updateOptions({ glyphMargin: false });
					}}
				/>
			)}
			<RenderDiffBottomBarInArticle
				// title={title}
				oldRevision={oldRevision}
				newRevision={newRevision}
				filePath={filePath}
				type={changeType}
				diffViewMode={diffView}
				onDiffViewPick={setViewModeWrapper}
				hasWysiwyg={hasEditTree}
			/>
		</div>
	);
};

export default ArticleDiffModeView;
