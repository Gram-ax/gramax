import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLink from "@components/Molecules/ButtonLink";
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
						<ButtonLink
							onClick={() => editOnClick()}
							textSize={TextSize.S}
							iconCode="pen"
							text={useLocalize("edit") + "..."}
						/>
					)}

					<ButtonLink
						onClick={() => {
							ArticleUpdaterService.stopLoadingAfterFocus();
							deleteOnClick();
						}}
						textSize={TextSize.S}
						iconCode="trash"
						text={deleteText}
					/>
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
