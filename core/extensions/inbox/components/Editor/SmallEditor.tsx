import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsMenuBarOpenService from "@core-ui/ContextServices/IsMenuBarOpenService";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import { Editor, EditorContent, JSONContent, useEditor, Extensions } from "@tiptap/react";
import { memo, useCallback, useEffect, useMemo } from "react";
import styled from "@emotion/styled";
import { ContentEditorId } from "@ext/markdown/core/edit/components/ContentEditor";
import Menu from "@ext/inbox/components/Editor/Menu";
import OnDeleteNode from "@ext/markdown/elements/onDocChange/OnDeleteNode";
import deleteDiagrams from "@ext/markdown/elements/diagrams/logic/deleteDiagrams";
import deleteDrawio from "@ext/markdown/elements/drawio/edit/logic/deleteDrawio";
import deleteOpenApi from "@ext/markdown/elements/openApi/edit/logic/deleteOpenApi";
import deleteImages from "@ext/markdown/elements/image/edit/logic/deleteImages";
import { Mark, Node } from "@tiptap/pm/model";
import OnDeleteMark from "@ext/markdown/elements/onDocChange/OnDeleteMark";
import deleteFiles from "@ext/markdown/elements/file/edit/logic/deleteFiles";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import CopyArticles from "@ext/markdown/elements/copyArticles/copyArticles";
import imageHandlePaste from "@ext/markdown/elements/image/edit/logic/imageHandlePaste";
import { EditorView } from "@tiptap/pm/view";
import { classNames } from "@components/libs/classNames";

type MiniProps<T> = T extends { title: string; content: JSONContent } ? T : { title: string; content: JSONContent };

interface SmallEditorOptions {
	menu?: (editor: Editor) => JSX.Element;
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
	updateCallback?: (id: string, content: JSONContent, title: string) => void;
	options?: SmallEditorOptions;
	className?: string;
}

const SmallEditor = <T extends MiniProps<any>>(proprs: SmallEditorProps<T>) => {
	const { id, props, content, articleType, extensions = [], updateCallback, options, className } = proprs;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const resourceService = ResourceService.value;

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
		[id, apiUrlCreator, props],
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

	const editorExtensions = useMemo(() => {
		return extensions;
	}, [extensions]);

	const onDeleteNodes = useCallback(
		(nodes: Node[]): void => {
			if (!resourceService?.id) return;
			deleteImages(nodes, resourceService);
			deleteDrawio(nodes, resourceService);
			deleteOpenApi(nodes, resourceService);
			deleteDiagrams(nodes, resourceService);
		},
		[resourceService],
	);

	const onDeleteMarks = useCallback(
		(marks: Mark[]): void => {
			if (!resourceService?.id) return;
			deleteFiles(marks, resourceService);
		},
		[resourceService],
	);

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
			content: content ?? { type: "doc", content: [{ type: "paragraph" }, { type: "paragraph" }] },
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
			autofocus: content.content.length === 2,
		},
		[content],
	);

	useEffect(() => {
		if (!editor || !resourceService) return;

		const copyArticlesExtension = editor.extensionManager.extensions.find((ext) => ext.name === "copyArticles");
		if (copyArticlesExtension) copyArticlesExtension.options.resourceService = resourceService;
	}, [resourceService?.data]);

	return (
		<SmallEditorWrapper className={classNames(className, {}, ["article"])}>
			<div className="mini-article">
				<div className="mini-article-body">
					<EditorContent
						data-qa="article-editor"
						data-iseditable={true}
						editor={editor}
						className={"article-body"}
					/>
					<ArticleMat editor={editor} />
				</div>
			</div>
			<IsMenuBarOpenService.Provider>
				<Menu menu={options?.menu} editor={editor} id={ContentEditorId} />
			</IsMenuBarOpenService.Provider>
		</SmallEditorWrapper>
	);
};

export default memo(SmallEditor);
