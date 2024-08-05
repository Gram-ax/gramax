import { classNames } from "@components/libs/classNames";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { Editor } from "@tiptap/core";
import { Slice } from "@tiptap/pm/model";
import { EditorView } from "prosemirror-view";
import ErrorHandler from "../../extensions/errorHandlers/client/components/ErrorHandler";
import ContentEditor from "../../extensions/markdown/core/edit/components/ContentEditor";
import getExtensions from "../../extensions/markdown/core/edit/logic/getExtensions";
import Renderer from "../../extensions/markdown/core/render/components/Renderer";
import getComponents from "../../extensions/markdown/core/render/components/getComponents/getComponents";
import Header from "../../extensions/markdown/elements/heading/render/component/Header";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import t from "@ext/localization/locale/translate";

interface ArticleRendererProps {
	data: ArticlePageData;
	onCreate: () => void;
	onBlur: ({ editor }: { editor: Editor }) => void;
	onUpdate: ({ editor }: { editor: Editor }) => void;
	onSelectionUpdate: ({ editor }: { editor: Editor }) => void;
	handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => boolean;
}

const ArticleRenderer = (props: ArticleRendererProps) => {
	const { data, onCreate, onBlur, onUpdate, onSelectionUpdate, handlePaste } = props;
	const isEdit = IsEditService.value;
	const articleProps = ArticlePropsService.value;

	return (
		<div className={classNames("article-body")}>
			<ErrorHandler alertTitle={t("article.error.render-failed")} isAlert>
				{isEdit ? (
					<ContentEditor
						content={data.articleContentEdit}
						extensions={getExtensions()}
						onCreate={onCreate}
						onBlur={onBlur}
						onUpdate={onUpdate}
						handlePaste={handlePaste}
						onSelectionUpdate={onSelectionUpdate}
						deps={[data.articleProps.ref.path]}
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
					</>
				)}
			</ErrorHandler>
		</div>
	);
};

export default ArticleRenderer;
