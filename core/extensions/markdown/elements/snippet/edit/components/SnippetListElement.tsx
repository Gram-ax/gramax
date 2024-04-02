import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import Sidebar from "@components/Layouts/Sidebar";
import ModalLoading from "@components/ModalLoading";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useLocalize from "@ext/localization/useLocalize";
import onSnippetEdit from "@ext/markdown/elements/snippet/edit/logic/onSnippetEdit";
import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";
import { useState } from "react";

const SnippetListElement = ({ snippet, onEditClick }: { snippet: SnippetEditorProps; onEditClick: () => void }) => {
	const [isLoading, setIsLoading] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const editText = useLocalize("edit2");
	const snippetDeleteConfirmText = `${useLocalize("deleteSnippetConfirmNotUse")}. ${useLocalize(
		"deleteSnippetConfirm",
	)}`;

	if (isLoading) return <ModalLoading />;

	return (
		<div style={{ width: "100%", padding: "5px 10px" }}>
			<Sidebar
				title={snippet.title}
				leftActions={[<Icon faFw key={0} code="file" />]}
				rightActions={[
					<Tooltip content={editText} key={0}>
						<div
							onClick={(e) => {
								onEditClick();
								onSnippetEdit(
									snippet.id,
									apiUrlCreator,
									snippetDeleteConfirmText,
									() => setIsLoading(true),
									() => setIsLoading(false),
								);
								e.stopPropagation();
							}}
						>
							<Icon faFw code="pen-to-square" />
						</div>
					</Tooltip>,
				]}
			/>
		</div>
	);
};

export default SnippetListElement;
