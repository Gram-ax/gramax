import { classNames } from "@components/libs/classNames";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import t from "@ext/localization/locale/translate";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import { Editor } from "@tiptap/core";
import { Slice } from "@tiptap/pm/model";
import { EditorView } from "prosemirror-view";
import ErrorHandler from "../../extensions/errorHandlers/client/components/ErrorHandler";
import ContentEditor from "../../extensions/markdown/core/edit/components/ContentEditor";
import getExtensions from "../../extensions/markdown/core/edit/logic/getExtensions";
import Renderer from "../../extensions/markdown/core/render/components/Renderer";
import getComponents from "../../extensions/markdown/core/render/components/getComponents/getComponents";
import Header from "../../extensions/markdown/elements/heading/render/component/Header";

interface ArticleRendererProps {
	data: ArticlePageData;
	onBlur: ({ editor }: { editor: Editor }) => void;
	onUpdate: ({ editor }: { editor: Editor }) => void;
	onSelectionUpdate: ({ editor }: { editor: Editor }) => void;
	onTitleLoseFocus: ({ newTitle }: { newTitle: string }) => void;
	handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => boolean;
}

const ArticleRenderer = (props: ArticleRendererProps) => {
	const { data, onBlur, onTitleLoseFocus, onUpdate, onSelectionUpdate, handlePaste } = props;
	const isEdit = IsEditService.value;
	const articleProps = ArticlePropsService.value;

	return (
		<div className={classNames("article-body")}>
			<ErrorHandler alertTitle={t("article.error.render-failed")} isAlert>
				{isEdit ? (
					<ContentEditor
						content={data.articleContentEdit}
						extensions={getExtensions()}
						onBlur={onBlur}
						onTitleLoseFocus={onTitleLoseFocus}
						onUpdate={onUpdate}
						handlePaste={handlePaste}
						onSelectionUpdate={onSelectionUpdate}
					/>
				) : (
					<>
						<Header level={1} className={"article-title"} dataQa={"article-title"}>
							{articleProps.title}
						</Header>
						{!articleProps.description ? null : (
							<Header level={2} className={"article-description"} dataQa={"article-description"}>
								{articleProps.description}
							</Header>
						)}
						{Renderer(JSON.parse(data.articleContentRender), { components: getComponents() })}
						<ArticleMat />
					</>
				)}
			</ErrorHandler>
		</div>
	);
};

export default ArticleRenderer;
