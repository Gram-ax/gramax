import DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInput";
import Path from "@core/FileProvider/Path/Path";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import useSetupRightNavCloseHandler from "@core-ui/hooks/diff/useSetupRightNavCloseHandler";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { DiffViewMode } from "@ext/markdown/elements/diff/components/DiffBottomBar";
import { DiffModeView } from "@ext/markdown/elements/diff/components/DiffModeView";
import RenderDiffBottomBarInBody from "@ext/markdown/elements/diff/components/RenderDiffBottomBarInBody";
import { updateDiffViewMode, useDiffViewMode } from "@ext/markdown/elements/diff/components/store/DiffViewModeStore";
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
	const diffViewService = useDiffViewMode();
	const catalogName = useCatalogPropsStore((state) => state.data?.name);

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
		updateDiffViewMode(mode);
		onViewModeChange?.(mode);
	};

	return (
		<div style={{ height: "inherit" }}>
			{isWysiwyg && hasEditTree && (
				<div className="article-body" style={{ height: "inherit" }}>
					<DiffModeView
						articlePath={articlePath}
						changeType={changeType}
						filePath={filePath}
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
			{(diffView === "single-panel" || diffView === "double-panel") && (
				<DiffFileInput
					containerStyles={{ padding: "0" }}
					height={"100vh"}
					modified={newContent}
					onChange={(value) => {
						onMonacoUpdate?.(value);
					}}
					onMount={(editor) => {
						// https://github.com/microsoft/monaco-editor/issues/4448
						editor.getOriginalEditor().updateOptions({ glyphMargin: false });
					}}
					options={{
						readOnly: isDeleted || readOnly,
						renderSideBySide: diffView === "double-panel",
						useInlineViewWhenSpaceIsLimited: false,
						renderOverviewRuler: false,
						glyphMargin: false,
					}}
					original={oldContent}
				/>
			)}
			<RenderDiffBottomBarInBody
				// title={title}
				diffViewMode={diffView}
				filePath={filePath}
				hasWysiwyg={hasEditTree}
				newRevision={newRevision}
				oldRevision={oldRevision}
				onDiffViewPick={setViewModeWrapper}
				type={changeType}
			/>
		</div>
	);
};

export default ArticleDiffModeView;
