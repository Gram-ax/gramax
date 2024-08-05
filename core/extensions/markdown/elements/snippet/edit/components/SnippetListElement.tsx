import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import Sidebar from "@components/Layouts/Sidebar";
import ModalLoading from "@components/ModalLoading";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import t from "@ext/localization/locale/translate";
import onSnippetDeleteCallback from "@ext/markdown/elements/snippet/edit/logic/onSnippetDeleteCallback";
import onSnippetEdit from "@ext/markdown/elements/snippet/edit/logic/onSnippetEdit";
import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";
import { useState } from "react";

const SnippetListElement = ({
	snippet,
	onEditClick,
	onOpen,
	onClose,
}: {
	snippet: SnippetEditorProps;
	onEditClick: () => void;
	onOpen?: () => void | Promise<void>;
	onClose?: () => void | Promise<void>;
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const articleProps = ArticlePropsService.value;
	const editText = t("edit2");
	const currentArticlePathname = articleProps.pathname;
	const snippetDeleteConfirmText = `${t("delete-snippet-confirm-not-use")}. ${t("delete-snippet-confirm")}`;

	if (isLoading) return <ModalLoading />;

	return (
		<div style={{ width: "100%", padding: "5px 13px" }}>
			<Sidebar
				title={snippet.title}
				rightActions={[
					<Tooltip content={editText} key={0}>
						<div
							onClick={(e) => {
								onEditClick();
								onSnippetEdit({
									snippetId: snippet.id,
									apiUrlCreator,
									snippetDeleteConfirmText,
									onStartFetch: () => setIsLoading(true),
									onStopFetch: () => setIsLoading(false),
									onDelete: (usedInArticles) => {
										onSnippetDeleteCallback(usedInArticles, currentArticlePathname);
									},
									onOpen,
									onClose,
								});
								e.stopPropagation();
							}}
						>
							<Icon code="pencil" />
						</div>
					</Tooltip>,
				]}
			/>
		</div>
	);
};

export default SnippetListElement;
