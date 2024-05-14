import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import useLocalize from "../../extensions/localization/useLocalize";
import ArticleUpdaterService from "../Article/ArticleUpdater/ArticleUpdaterService";
import PopupMenuLayout from "../Layouts/PopupMenuLayout";

export interface MenuProps {
	deleteOnClick: () => void;
	editOnClick: () => void;
	showEditButton?: boolean;
	deleteText?: string;
	className?: string;
}

const Menu = styled((props: MenuProps) => {
	const { showEditButton = true, deleteOnClick, editOnClick, deleteText = useLocalize("delete"), className } = props;

	return (
		<div className={className}>
			<PopupMenuLayout>
				{showEditButton && (
					<ButtonLink
						fullWidth
						onClick={() => editOnClick()}
						textSize={TextSize.S}
						iconCode="pencil"
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
})`
	.button:hover {
		color: var(--color-primary);
	}
`;

export default Menu;
