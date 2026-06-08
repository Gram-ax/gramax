import { ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE } from "@components/Layouts/CatalogLayout/ArticleLayout/consts";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { isActive } from "@core-ui/hooks/useAudioRecorder";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { useEditorStore } from "@core-ui/stores/EditorStore";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import AudioRecorderService from "@ext/ai/components/Audio/AudioRecorderService";
import { ArticleAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";
import { useIsDiffView } from "@ext/git/core/Diff/logic/hooks/useIsDiffView";
import ToolbarMenu from "@ext/markdown/core/edit/components/Menu/Menus/Toolbar";
import ToolbarWrapper from "@ext/markdown/core/edit/components/Menu/ToolbarWrapper";
import { useToolbarViewport } from "@ext/markdown/core/edit/logic/Toolbar/useToolbarViewport";
import { useRef } from "react";

const ArticleToolbar = () => {
	const editor = useEditorStore((s) => s.editor);
	const pageDataContext = PageDataContext.value;
	const isGramaxAiEnabled = pageDataContext?.conf?.ai?.enabled;

	const { recorderState } = AudioRecorderService.value;

	return (
		<div className="w-full" data-toolbar="bottom">
			{isActive(recorderState) && <ArticleAudioToolbar editor={editor} />}
			<div className="lg:shadow-hard-base rounded-lg md:[&>div]:rounded-lg">
				<ButtonStateService.Provider editor={editor}>
					<ToolbarMenu editor={editor} isGramaxAiEnabled={isGramaxAiEnabled} />
				</ButtonStateService.Provider>
			</div>
		</div>
	);
};

const ArticleExtensions = () => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const toolbarRef = useToolbarViewport();
	const containerRef = useRef<HTMLDivElement>(null);
	const articleErrorCode = useArticlePropsStore((state) => state.data?.errorCode);
	const isReadOnly = PageDataContext.value.conf.isReadOnly;
	const isDiffView = useIsDiffView();
	const isRevision = useIsRevision();
	const isSmallEditor = useEditorStore((s) => s.isSmallEditor);

	if (articleErrorCode || (isReadOnly && !isDiffView && !isRevision) || isSmallEditor) return null;

	return (
		<>
			{isMobile && <div className="h-[var(--keyboard-height, 0px)]" />}
			<div
				className={cn(
					"flex md:justify-center sticky z-[var(--z-index-toolbar)] -ml-[20px] md:ml-0 md:left-0 md:right-0 bottom-0 md:bottom-1 pointer-events-none",
					`w-[calc(100vw+30px)] md:w-auto md:max-w-[var(${ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE})]`,
				)}
			>
				<ToolbarWrapper
					className="transition-all duration-500 sm:[&>div]:rounded-lg max-w-full w-full md:w-auto"
					ref={toolbarRef}
				>
					<div
						className={cn(
							"flex flex-col items-center gap-1 print:hidden",
							isMobile && "overflow-visible block gap-0 pb-0",
						)}
						ref={containerRef}
					>
						<ArticleToolbar />
					</div>
				</ToolbarWrapper>
			</div>
		</>
	);
};

export default ArticleExtensions;
