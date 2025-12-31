import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";

interface CommentTitleActionsProps {
	isCurrentUser: boolean;
	onClickEdit: () => void;
	onClickDelete: () => void;
}

export const CommentTitleActions = (props: CommentTitleActionsProps) => {
	const { isCurrentUser, onClickEdit, onClickDelete } = props;

	const showActions = Boolean(onClickEdit);

	if (!showActions) return null;

	return (
		<div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
			{isCurrentUser && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<IconButton
							icon="ellipsis-vertical"
							variant="ghost"
							size="xs"
							className="h-auto"
							iconClassName="h-3 w-3"
							style={{ marginRight: "-0.2rem" }}
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem onSelect={onClickEdit}>
							<Icon icon="pen" />
							{t("edit2")}
						</DropdownMenuItem>
						{onClickDelete && (
							<DropdownMenuItem type="danger" onSelect={onClickDelete}>
								<Icon icon="trash" />
								{t("delete")}
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
};
