import styled from "@emotion/styled";
import useLocalize from "../../extensions/localization/useLocalize";
import ArticleUpdaterService from "../Article/ArticleUpdater/ArticleUpdaterService";
import PopupMenuLayout from "../Layouts/PopupMenuLayout";

const Menu = styled(
	({
		showEditButton = true,
		deleteOnClick,
		editOnClick,
		deleteText = useLocalize("delete"),
		className,
	}: {
		deleteOnClick: () => void;
		editOnClick: () => void;
		showEditButton?: boolean;
		deleteText?: string;
		className?: string;
	}) => {
		return (
			<div className={className}>
				<PopupMenuLayout>
					{showEditButton && (
						<div onClick={() => editOnClick()}>
							<span>{useLocalize("edit") + "..."}</span>
						</div>
					)}

					<div
						onClick={() => {
							ArticleUpdaterService.stopLoadingAfterFocus();
							deleteOnClick();
						}}
					>
						<span>{deleteText}</span>
					</div>
				</PopupMenuLayout>
			</div>
		);
	},
)`
	.button:hover {
		color: var(--color-primary);
	}
`;

export default Menu;
