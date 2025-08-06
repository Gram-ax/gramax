import DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInput";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import DiffViewModeService from "@core-ui/ContextServices/DiffViewModeService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import useSetupRightNavCloseHandler from "@core-ui/hooks/diff/useSetupRightNavCloseHandler";
import Path from "@core/FileProvider/Path/Path";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { DiffViewMode } from "@ext/markdown/elements/diff/components/DiffBottomBar";
import { DiffModeView } from "@ext/markdown/elements/diff/components/DiffModeView";
import RenderDiffBottomBarInBody from "@ext/markdown/elements/diff/components/RenderDiffBottomBarInBody";
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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

	const isAdded = changeType === FileStatus.new;
	const isDeleted = changeType === FileStatus.delete;
	const hasEditTree = (() => {
		if (isDeleted) return !!oldEditTree;
		if (isAdded) return !!newEditTree;
		return !!oldEditTree && !!newEditTree;
	})();

	const articleProps = ArticlePropsService.value;
	const diffViewService = DiffViewModeService.value;
	const catalogName = CatalogPropsService.value?.name;

	const restoreRightSidebar = useRestoreRightSidebar();
	const [diffView, setDiffView] = useState(diffViewService);

	const isWysiwyg = diffView === "wysiwyg-single" || diffView === "wysiwyg-double";

	useLayoutEffect(() => {
		if (!hasEditTree && isWysiwyg) setDiffView("single-panel");
	}, []);

	useEffect(() => {
		const listener = () => {
			restoreRightSidebar();
			ArticleViewService.setDefaultView();
			const clickOnCurrentArticle = Path.join(catalogName, articlePath) === articleProps.ref.path;
			if (clickOnCurrentArticle) refreshPage();
		};

		const token = NavigationEvents.on("item-click", listener);

		return () => {
			NavigationEvents.off(token);
		};
	}, [restoreRightSidebar, articlePath, articleProps, catalogName]);

	const setupRightNavCloseHandler = useSetupRightNavCloseHandler();

	useEffect(() => {
		setupRightNavCloseHandler();
	}, []);

	const setViewModeWrapper = (mode: DiffViewMode) => {
		setDiffView(mode);
		DiffViewModeService.value = mode;
		onViewModeChange?.(mode);
	};

	return (
		<div style={{ height: "inherit" }}>
			{isWysiwyg && hasEditTree && (
				<div className="article-body" style={{ height: "inherit" }}>
					<DiffModeView
						filePath={filePath}
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
						readOnly: isDeleted || readOnly,
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
			<RenderDiffBottomBarInBody
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
