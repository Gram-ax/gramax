import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
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
	const { showEditButton = true, deleteOnClick, editOnClick, deleteText = t("delete"), className } = props;

	return (
		<div className={className}>
			<PopupMenuLayout>
				{showEditButton && (
					<ButtonLink
						onClick={() => editOnClick()}
						textSize={TextSize.S}
						iconCode="pencil"
						text={t("edit") + "..."}
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
