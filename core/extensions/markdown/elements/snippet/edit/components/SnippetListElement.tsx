import Sidebar from "@components/Layouts/Sidebar";
import t from "@ext/localization/locale/translate";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import Icon from "@components/Atoms/Icon";
import { MouseEvent } from "react";

interface SnippetListElementProps {
	snippet: ProviderItemProps;
	onEditClick: (snippet: ProviderItemProps) => void;
}

const SnippetListElement = ({ snippet, onEditClick }: SnippetListElementProps) => {
	const onEditClickHandler = (e: MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		e.preventDefault();

		onEditClick(snippet);
	};

	return (
		<div style={{ width: "100%", padding: "5px 13px" }}>
			<Sidebar
				title={snippet.title || t("article.no-name")}
				rightActions={[
					<Icon
						tooltipContent={t("edit2")}
						key={"pencil-snippet-" + snippet.id}
						code="pencil"
						onClick={onEditClickHandler}
					/>,
				]}
			/>
		</div>
	);
};

export default SnippetListElement;
