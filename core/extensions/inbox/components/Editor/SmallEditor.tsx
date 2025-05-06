import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsMenuBarOpenService from "@core-ui/ContextServices/IsMenuBarOpenService";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import Path from "@core/FileProvider/Path/Path";
import { ArticleProviderType } from "@core/FileStructue/Article/ArticleProvider";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import { Editor, EditorContent, JSONContent, useEditor, Extensions } from "@tiptap/react";
import { memo, useCallback, useMemo } from "react";
import styled from "@emotion/styled";
import { ContentEditorId } from "@ext/markdown/core/edit/components/ContentEditor";
import Menu from "@ext/inbox/components/Editor/Menu";

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
	path: string;
	articleType: ArticleProviderType;
	extensions?: Extensions;
	updateCallback?: (id: string, content: JSONContent, title: string) => void;
	options?: SmallEditorOptions;
	className?: string;
}

const SmallEditor = <T extends MiniProps<any>>(proprs: SmallEditorProps<T>) => {
	const { id, props, content, path, articleType, extensions = [], updateCallback, options, className } = proprs;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const updateContent = useCallback(
		async (content: JSONContent, title: string) => {
			const curPath = new Path(path);
			const url = apiUrlCreator.updateFileInGramaxDir(curPath.name, articleType);

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

	const editor = useEditor(
		{
			onUpdate: onUpdateContent,
			content: content ?? { type: "doc", content: [{ type: "paragraph" }, { type: "paragraph" }] },
			injectCSS: false,
			extensions: editorExtensions,
			editable: true,
			autofocus: content.content.length === 2,
		},
		[content],
	);

	return (
		<SmallEditorWrapper className={className}>
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
