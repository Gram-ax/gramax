import Icon from "@components/Atoms/Icon";
import Sidebar from "@components/Layouts/Sidebar";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import type { MouseEvent } from "react";

interface FragmentListElementProps {
	fragment: ProviderItemProps;
	onEditClick: (fragment: ProviderItemProps) => void;
}

const FragmentListElement = ({ fragment, onEditClick }: FragmentListElementProps) => {
	const onEditClickHandler = (e: MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		e.preventDefault();

		onEditClick(fragment);
	};

	return (
		<div style={{ width: "100%", padding: "5px 13px" }}>
			<Sidebar
				rightActions={[
					<Icon
						code="pencil"
						key={`pencil-fragment-${fragment.id}`}
						onClick={onEditClickHandler}
						tooltipContent={t("edit2")}
					/>,
				]}
				title={fragment.title || t("article.no-name")}
			/>
		</div>
	);
};

export default FragmentListElement;
