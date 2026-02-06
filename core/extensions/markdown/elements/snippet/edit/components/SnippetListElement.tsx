import Icon from "@components/Atoms/Icon";
import Sidebar from "@components/Layouts/Sidebar";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
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
				rightActions={[
					<Icon
						code="pencil"
						key={"pencil-snippet-" + snippet.id}
						onClick={onEditClickHandler}
						tooltipContent={t("edit2")}
					/>,
				]}
				title={snippet.title || t("article.no-name")}
			/>
		</div>
	);
};

export default SnippetListElement;
