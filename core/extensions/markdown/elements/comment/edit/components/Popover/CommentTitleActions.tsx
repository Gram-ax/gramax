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
		<div className="flex items-center gap-0.5 ml-auto flex-shrink-0" style={{ marginRight: "-0.5rem" }}>
			{isCurrentUser && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<IconButton
							className="h-auto w-5 h-5 p-0"
							icon="ellipsis-vertical"
							iconClassName="h-4 w-4"
							size="xs"
							variant="text"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem onSelect={onClickEdit}>
							<Icon icon="pen" />
							{t("edit2")}
						</DropdownMenuItem>
						{onClickDelete && (
							<DropdownMenuItem onSelect={onClickDelete} type="danger">
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
