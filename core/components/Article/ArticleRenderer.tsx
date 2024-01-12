import { classNames } from "@components/libs/classNames";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import { ArticleData } from "@core/SitePresenter/SitePresenter";
import { Editor } from "@tiptap/core";
import { Slice } from "@tiptap/pm/model";
import { EditorView } from "prosemirror-view";
import ErrorHandler from "../../extensions/errorHandlers/client/components/ErrorHandler";
import ContentEditor from "../../extensions/markdown/core/edit/components/ContentEditor";
import getExtensions from "../../extensions/markdown/core/edit/logic/getExtensions";
import Renderer from "../../extensions/markdown/core/render/components/Renderer";
import getComponents from "../../extensions/markdown/core/render/components/getComponents/getComponents";

const ArticleRenderer = ({
	data,
	onCreate,
	onBlur,
	onUpdate,
	onSelectionUpdate,
	handlePaste,
}: {
	data: ArticleData;
	onCreate: () => void;
	onBlur: ({ editor }: { editor: Editor }) => void;
	onUpdate: ({ editor }: { editor: Editor }) => void;
	onSelectionUpdate: ({ editor }: { editor: Editor }) => void;
	handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => boolean;
}) => {
	const isEdit = IsEditService.value;

	return (
		<>
			{/*  !!! */}
			<div className={classNames("article-body", { linkViewMode: !isEdit })} data-qa="article-body">
				<ErrorHandler>
					<>
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
							Renderer(JSON.parse(data.articleContentRender), { components: getComponents() })
						)}
					</>
				</ErrorHandler>
			</div>
		</>
	);
};

export default ArticleRenderer;
