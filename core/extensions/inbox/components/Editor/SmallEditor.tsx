import { classNames } from "@components/libs/classNames";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { useDebounce } from "@core-ui/hooks/useDebounce";
// biome-ignore lint/style/noRestrictedImports: refactor in future releases
import styled from "@emotion/styled";
import type { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import SmallEditorToolbar from "@ext/inbox/components/Editor/SmallEditorToolbar";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import type { ToolbarMenuProps } from "@ext/markdown/core/edit/components/Menu/Menus/Toolbar";
import useContentEditorHooks from "@ext/markdown/core/edit/components/UseContentEditorHooks";
import { useShouldShowInlineToolbar } from "@ext/markdown/core/edit/logic/hooks/useShouldShowInlineToolbar";
import type { InlineToolbarButtons } from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import { InlineToolbar } from "@ext/markdown/elements/article/edit/helpers/InlineToolbar";
import CopyArticles from "@ext/markdown/elements/copyArticles/copyArticles";
import deleteFiles from "@ext/markdown/elements/file/edit/logic/deleteFiles";
import imageHandlePaste from "@ext/markdown/elements/image/edit/logic/imageHandlePaste";
import { InlineLinkMenu } from "@ext/markdown/elements/link/edit/components/LinkMenu/InlineLinkMenu";
import OnDeleteMark from "@ext/markdown/elements/onDocChange/OnDeleteMark";
import OnDeleteNode from "@ext/markdown/elements/onDocChange/OnDeleteNode";
import type { Mark } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { type Editor, EditorContent, type Extensions, type JSONContent, useEditor } from "@tiptap/react";
import { memo, useCallback, useEffect, useMemo } from "react";

type MiniProps<T> = T extends { title: string; content: JSONContent } ? T : { title: string; content: JSONContent };

interface SmallEditorOptions {
	menuProps?: ToolbarMenuProps;
}

const SmallEditorWrapper = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;

	.full-article {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.mini-article {
		flex: 1 1 0px;
		display: flex;
		flex-direction: column;
	}

	.mini-article-page-wrapper {
		gap: 1rem;
		flex: 1 1 0px;
		display: flex;
		flex-direction: column;
	}

	.mini-article-container {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.mini-article-body {
		flex: 1;
		display: flex;
		position: relative;
		flex-direction: column;
	}

	.article-body {
		flex: unset;
	}
`;

interface SmallEditorProps<T> {
	id: string;
	props: MiniProps<T>;
	content: JSONContent;
	articleType: ArticleProviderType;
	extensions?: Extensions;
	options?: SmallEditorOptions;
	className?: string;
	disableToolbar?: boolean;
	inlineToolbarButtons?: InlineToolbarButtons;
	updateCallback?: (id: string, content: JSONContent, title: string) => void;
}

const defaultContent = { type: "doc", content: [{ type: "paragraph" }, { type: "paragraph" }] };

const editorButtons: InlineToolbarButtons = {
	inlineGroup: {
		file: false,
		comment: false,
		prettify: false,
	},
};

const SmallEditor = <T extends MiniProps<unknown>>(proprs: SmallEditorProps<T>) => {
	const {
		id,
		props,
		content = defaultContent,
		articleType,
		extensions = [],
		updateCallback,
		options,
		className,
		inlineToolbarButtons = editorButtons,
		disableToolbar = false,
	} = proprs;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const resourceService = ResourceService.value;

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const newApiUrlCreator = useMemo(() => {
		return ApiUrlCreator.createFrom(apiUrlCreator, id, articleType);
	}, [apiUrlCreator, id, articleType]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const updateContent = useCallback(
		async (content: JSONContent, title: string) => {
			const url = apiUrlCreator.updateFileInGramaxDir(id, articleType);

			const articleProps = {
				...props,
				title,
			};

			await FetchService.fetch(url, JSON.stringify({ editTree: content, props: articleProps }), MimeTypes.json);
			updateCallback?.(id, content, title);
		},
		[id, apiUrlCreator, props, articleType, updateCallback],
	);

	const debouncedUpdateContent = useDebounce(updateContent, 500);

	const onUpdateContent = useCallback(
		({ editor }: { editor: Editor }) => {
			const json = editor.getJSON();
			const title = editor.state.doc.firstChild?.textContent?.trim();
			json.content.shift();
			debouncedUpdateContent.cancel();
			debouncedUpdateContent.start(json, title);
		},
		[debouncedUpdateContent],
	);

	const updateLinkExtansion = useCallback(() => {
		if (!newApiUrlCreator) return;
		const linkExtension = extensions.find((ext) => ext.name === "link");

		if (!linkExtension) return;
		linkExtension.options.apiUrlCreator = newApiUrlCreator;
	}, [extensions, newApiUrlCreator]);

	const editorExtensions = useMemo(() => {
		updateLinkExtansion();
		return extensions;
	}, [extensions, updateLinkExtansion]);

	const { onDeleteNodes } = useContentEditorHooks();

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const onDeleteMarks = useCallback(
		(marks: Mark[]): void => {
			if (!resourceService?.id) return;
			void deleteFiles(marks, resourceService);
		},
		[resourceService],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const handlePaste = useCallback(
		(view: EditorView, event: ClipboardEvent) => {
			if (!resourceService?.id) return false;
			if (!event.clipboardData) return false;
			if (event.clipboardData.files.length !== 0) return imageHandlePaste(view, event, id, resourceService);
		},
		[resourceService, id],
	);

	const editor = useEditor(
		{
			onUpdate: onUpdateContent,
			content: content,
			injectCSS: false,
			extensions: [
				...editorExtensions,
				OnDeleteNode.configure({ onDeleteNodes }),
				OnDeleteMark.configure({ onDeleteMarks }),
				CopyArticles.configure({ apiUrlCreator, resourceService }),
			],
			editable: true,
			editorProps: {
				handlePaste,
			},
			autofocus: content?.content?.length === 2,
		},
		[content],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!editor || !resourceService) return;

		const copyArticlesExtension = editor.extensionManager.extensions.find((ext) => ext.name === "copyArticles");
		if (copyArticlesExtension) copyArticlesExtension.options.resourceService = resourceService;
	}, [resourceService?.data]);

	const shouldShow = useShouldShowInlineToolbar();

	return (
		<ApiUrlCreatorService.Provider value={newApiUrlCreator}>
			<SmallEditorWrapper className={classNames(className, {}, ["article"])}>
				<div className="mini-article">
					<div className="mini-article-body">
						<InlineLinkMenu editor={editor} />
						<InlineToolbar buttons={inlineToolbarButtons} editor={editor} shouldShow={shouldShow} />
						<EditorContent
							className={"article-body"}
							data-iseditable={true}
							data-qa="article-editor"
							editor={editor}
						/>
						<ArticleMat editor={editor} />
					</div>
				</div>
				{editor && !disableToolbar && <SmallEditorToolbar editor={editor} {...options?.menuProps} />}
			</SmallEditorWrapper>
		</ApiUrlCreatorService.Provider>
	);
};

export default memo(SmallEditor);
