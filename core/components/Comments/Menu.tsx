import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import ArticleUpdaterService from "../Article/ArticleUpdater/ArticleUpdaterService";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { IconButton } from "@ui-kit/Button";
import Icon from "@components/Atoms/Icon";

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
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<IconButton
						icon="ellipsis-vertical"
						variant="text"
						size="xs"
						style={{ height: "auto", padding: "0" }}
					/>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					{showEditButton && (
						<DropdownMenuItem onSelect={editOnClick}>
							<Icon code="pencil" />
							{t("edit2")}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						type="danger"
						onSelect={() => {
							ArticleUpdaterService.stopLoadingAfterFocus();
							deleteOnClick();
						}}
					>
						<Icon code="trash" />
						{deleteText}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
})`
	.button:hover {
		color: var(--color-primary);
	}
`;

export default Menu;
