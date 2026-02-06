import Date from "@components/Atoms/Date";
import type { CommentDateTime, CommentUser } from "@core-ui/CommentBlock";
import { cn } from "@core-ui/utils/cn";
import { CommentInput } from "@ext/markdown/elements/comment/edit/components/Popover/CommentInput";
import { CommentTitleActions } from "@ext/markdown/elements/comment/edit/components/Popover/CommentTitleActions";
import type { FocusPosition, JSONContent } from "@tiptap/core";
import { Avatar, AvatarFallback, getAvatarFallback } from "@ui-kit/Avatar";
import { Label } from "@ui-kit/Label";
import { StepperIndicator, StepperItem, StepperTitle, StepperTrigger } from "@ui-kit/Stepper";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type HTMLAttributes, memo, useCallback, useState } from "react";

interface CommentMessageProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
	index: number;
	user: CommentUser;
	isCurrentUser: boolean;
	content?: JSONContent[];
	editable?: boolean;
	date?: CommentDateTime;
	last?: boolean;
	autofocus?: FocusPosition;
	showName?: boolean;
	showAvatar?: boolean;
	onConfirm: (index: number, content: JSONContent[], hide: boolean) => void;
	onDelete?: (index: number) => void;
}

export const CommentMessage = memo((props: CommentMessageProps) => {
	const {
		index,
		user,
		isCurrentUser,
		content,
		date,
		editable = false,
		autofocus = false,
		showName = true,
		showAvatar = true,
		onConfirm,
		className,
		onDelete,
		...otherProps
	} = props;
	const [isEditing, setIsEditing] = useState(editable);
	const isOldContent = !!content;

	const onConfirmComment = useCallback(
		(content: JSONContent[]) => {
			if (isOldContent) setIsEditing(false);
			onConfirm(index, content, !isOldContent);
		},
		[onConfirm, index, isOldContent],
	);

	const onCancelComment = useCallback(() => {
		setIsEditing(false);
	}, []);

	return (
		<StepperItem className={cn("not-last:flex-1 relative items-start", className)} step={index} {...otherProps}>
			<StepperTrigger asChild>
				<div
					className={cn(
						"flex items-center rounded gap-1 w-full",
						!showName && !showAvatar ? "pl-2.5 py-2 pr-2" : "p-3",
					)}
				>
					{showAvatar && (
						<StepperIndicator
							asChild
							className="w-7 h-7"
							style={{ backgroundColor: "hsl(var(--secondary-border))", alignSelf: "baseline" }}
						>
							<Avatar className="border-none w-7 h-7" size="sm">
								<AvatarFallback uniqueId={user.mail}>{getAvatarFallback(user.name)}</AvatarFallback>
							</Avatar>
						</StepperIndicator>
					)}
					<div
						className={cn("flex flex-col pl-1 text-left w-full min-w-0 gap-2")}
						style={{ marginTop: "-1px", alignSelf: "baseline" }}
					>
						{showName && (
							<StepperTitle className="flex items-center gap-2 h-6" style={{ margin: 0 }}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Label className="whitespace-nowrap truncate text-primary-fg">
											{user.name}
										</Label>
									</TooltipTrigger>
									<TooltipContent>{user.mail}</TooltipContent>
								</Tooltip>
								<Date
									className="text-xs text-muted font-normal whitespace-nowrap truncate flex-shrink-0"
									date={date}
								/>
								<CommentTitleActions
									isCurrentUser={isCurrentUser}
									onClickDelete={onDelete ? () => onDelete?.(index) : undefined}
									onClickEdit={() => setIsEditing(true)}
								/>
							</StepperTitle>
						)}
						<CommentInput
							autofocus={autofocus || isOldContent}
							content={content}
							editable={isEditing}
							isNewComment={!content}
							onCancel={isOldContent && onCancelComment}
							onConfirm={onConfirmComment}
						/>
					</div>
				</div>
			</StepperTrigger>
		</StepperItem>
	);
});
