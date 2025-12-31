import { CommentDateTime, CommentUser } from "@core-ui/CommentBlock";
import { Avatar, AvatarFallback, getAvatarFallback } from "@ui-kit/Avatar";
import { FocusPosition, JSONContent } from "@tiptap/core";
import { Label } from "@ui-kit/Label";
import { CommentInput } from "@ext/markdown/elements/comment/edit/components/Popover/CommentInput";
import { StepperIndicator, StepperItem, StepperTitle, StepperTrigger } from "@ui-kit/Stepper";
import { cn } from "@core-ui/utils/cn";
import { HTMLAttributes, memo, useCallback, useState } from "react";
import Date from "@components/Atoms/Date";
import { CommentTitleActions } from "@ext/markdown/elements/comment/edit/components/Popover/CommentTitleActions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

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
		last = false,
		autofocus = false,
		showName = true,
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
		<StepperItem step={index} className={cn("not-last:flex-1 relative items-start", className)} {...otherProps}>
			<StepperTrigger asChild>
				<div className={cn("flex items-center rounded gap-1 w-full", !last && "mb-4")}>
					<StepperIndicator
						asChild
						style={{ backgroundColor: "hsl(var(--secondary-border))", alignSelf: "baseline" }}
					>
						<Avatar size="xs" className="border-none">
							<AvatarFallback uniqueId={user.mail}>{getAvatarFallback(user.name)}</AvatarFallback>
						</Avatar>
					</StepperIndicator>
					<div
						className={cn("flex flex-col pl-2 text-left w-full min-w-0")}
						style={{ marginTop: "-1px", alignSelf: "baseline" }}
					>
						{showName && (
							<StepperTitle className="flex items-center gap-2 h-6" style={{ margin: 0 }}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Label className="whitespace-nowrap truncate">{user.name}</Label>
									</TooltipTrigger>
									<TooltipContent>{user.mail}</TooltipContent>
								</Tooltip>
								<Date
									date={date}
									className="text-xs text-muted font-normal whitespace-nowrap truncate flex-shrink-0"
								/>
								<CommentTitleActions
									isCurrentUser={isCurrentUser}
									onClickEdit={() => setIsEditing(true)}
									onClickDelete={onDelete ? () => onDelete?.(index) : undefined}
								/>
							</StepperTitle>
						)}
						<CommentInput
							isNewComment={!content}
							content={content}
							editable={isEditing}
							autofocus={autofocus || isOldContent}
							onConfirm={onConfirmComment}
							onCancel={isOldContent && onCancelComment}
						/>
					</div>
				</div>
			</StepperTrigger>
		</StepperItem>
	);
});
