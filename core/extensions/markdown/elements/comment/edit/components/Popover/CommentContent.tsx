import { cn } from "@core-ui/utils/cn";
import { HTMLAttributes } from "react";
import styled from "@emotion/styled";
import { Stepper } from "@ui-kit/Stepper";

const StyledContainer = styled.div`
	display: flex;
	flex-direction: column;
	width: min(calc(100vw - 16px), 25rem);
	height: 100%;

	.scroll-area {
		max-height: min(100vh, 30rem);
	}
`;

export const CommentContent = ({ className, children, ...otherProps }: HTMLAttributes<HTMLDivElement>) => {
	return (
		<StyledContainer
			className={cn(
				"shadow-soft-lg z-50 rounded-lg border border-secondary-border bg-secondary-bg text-popover-foreground outline-none comment-block",
				className,
			)}
			{...otherProps}
		>
			<Stepper orientation="vertical">{children}</Stepper>
		</StyledContainer>
	);
};
