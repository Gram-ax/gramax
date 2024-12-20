import ArticleExtensions from "@components/Article/ArticleExtensions";
import ArticleWithPreviewArticle from "@components/ArticlePage/ArticleWithPreviewArticle";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import Path from "@core/FileProvider/Path/Path";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import Menu from "@ext/markdown/core/edit/components/Menu/Menu";
import { getSimpleExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import EditorExtensionsService from "@ext/markdown/elements/diff/components/EditorExtensionsService";
import ArticlePropsesCache from "@ext/markdown/elements/diff/logic/ArticlePropsesCache";
import DiffExtension from "@ext/markdown/elements/diff/logic/DiffExtension";
import useDiff from "@ext/markdown/elements/diff/logic/useDiff";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import ExtensionUpdater from "@ext/markdown/elementsUtils/editExtensionUpdator/ExtensionUpdater";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { Editor } from "@tiptap/core";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import { useEffect, useState } from "react";

interface DiffModeViewProps {
	oldContent: JSONContent;
	newContent: JSONContent;
	changeType: FileStatus;
	articlePath: string;
	readOnly?: boolean;
	onUpdate?: (props: { editor: Editor; apiUrlCreator: ApiUrlCreator; articleProps: ClientArticleProps }) => void;
}

export const DiffModeView = (props: DiffModeViewProps) => {
	const { oldContent, newContent, changeType, articlePath, readOnly = false, onUpdate: currentOnUpdate } = props;
	const extensions = EditorExtensionsService.value;

	const handlePaste = EditorService.getHandlePaste();
	const onUpdate = EditorService.getOnUpdate();
	const onBlur = EditorService.getOnBlur();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogName = CatalogPropsService.value.name;
	const diffArticleApiUrlCreator = apiUrlCreator.fromArticle(articlePath);
	const articlePropsesCache = ArticlePropsesCache.cache;
	const [articleProps, setArticleProps] = useState<ClientArticleProps>(articlePropsesCache[articlePath]);
	const isPin = SidebarsIsPinService.value;

	const setItemPropsData = async () => {
		const res = await FetchService.fetch<ClientArticleProps>(
			apiUrlCreator.getItemProps(Path.join(catalogName, articlePath)),
		);
		if (!res.ok) return;
		const data = await res.json();
		setArticleProps(data);
		articlePropsesCache[articlePath] = data;
	};

	useEffect(() => {
		if (!articlePropsesCache[articlePath]) void setItemPropsData();
	}, []);

	const UpdatedDiffExtension = ExtensionUpdater.getUpdatedExtension([
		DiffExtension.configure({ isPin }),
	])[0] as typeof DiffExtension;

	const getNewEditorExtensions = () => {
		if (!extensions) return getSimpleExtensions();
		const filteredExtensions = [...extensions.filter((e) => e.name !== "OnTitleLoseFocus"), UpdatedDiffExtension];
		if (readOnly) return filteredExtensions.filter((e) => e.name !== "selectionMenu");
		return filteredExtensions;
	};

	const newEditor = useEditor(
		{
			extensions: getNewEditorExtensions(),
			content: extensions ? newContent : undefined,
			editorProps: {
				handlePaste: (view, event, slice) =>
					handlePaste(view, event, slice, diffArticleApiUrlCreator, articleProps),
			},
			editable: !readOnly,
			onUpdate: ({ editor }) => {
				currentOnUpdate?.({ editor, apiUrlCreator: diffArticleApiUrlCreator, articleProps });
				onUpdate({ editor, apiUrlCreator: diffArticleApiUrlCreator, articleProps });
			},
			onBlur: ({ editor }) => onBlur({ editor, apiUrlCreator: diffArticleApiUrlCreator, articleProps }),
		},
		[extensions, newContent, articleProps],
	);

	const oldContentEditor = useEditor(
		{
			extensions: extensions
				? [
						...extensions.filter((e) => e.name !== "selectionMenu"),
						UpdatedDiffExtension.configure({ isOldEditor: true }),
				  ]
				: getSimpleExtensions(),
			editable: false,
			content: extensions ? oldContent : undefined,
		},
		[extensions, oldContent],
	);

	useEffect(() => {
		if (!newEditor || !oldContentEditor) return;
		newEditor.storage.diff.isPin = isPin;
		oldContentEditor.storage.diff.isPin = isPin;
	}, [isPin.left, isPin.right]);

	useDiff(
		changeType === FileStatus.modified
			? { editor: newEditor, oldContentEditor }
			: { editor: null, oldContentEditor: null },
	);

	if (!articleProps && changeType !== FileStatus.delete) return <SpinnerLoader fullScreen />;

	return (
		<ApiUrlCreatorService.Provider value={diffArticleApiUrlCreator}>
			<>
				<ArticleWithPreviewArticle
					mainArticle={
						changeType === FileStatus.delete ? (
							<EditorContent editor={oldContentEditor} data-qa="article-editor" data-iseditable={false} />
						) : (
							<EditorContent editor={newEditor} data-qa="article-editor" data-iseditable={true} />
						)
					}
					previewArticle={
						changeType === FileStatus.modified ? (
							<OnLoadResourceService.Provider>
								<div style={{ marginLeft: "0.5rem" }}>
									<EditorContent
										editor={oldContentEditor}
										data-qa="article-editor"
										data-iseditable={false}
									/>
								</div>
							</OnLoadResourceService.Provider>
						) : undefined
					}
				/>
				{!readOnly && (
					<>
						<Menu editor={newEditor} id={"diff-mode-extensions"} key={"diff-mode-extensions"} />
						<ArticleExtensions id={"diff-mode-extensions"} />
						<ArticleMat editor={newEditor} />
					</>
				)}
			</>
		</ApiUrlCreatorService.Provider>
	);
};

export default DiffModeView;
