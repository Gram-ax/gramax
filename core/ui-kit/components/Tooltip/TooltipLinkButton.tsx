import styled from "@emotion/styled";
import { Button } from "@ui-kit/Button";
import type { ExtractComponentGeneric } from "core/ui-kit/lib/extractComponentGeneric";

type TooltipLinkButtonProps = Omit<ExtractComponentGeneric<typeof Button>, "variant">;

const StyledButton = styled(Button)`
    padding: 0;
    height: auto;
    border-radius: 0;
    color: hsl(var(--inverse-muted));

	&:hover {
        color: hsl(var(--inverse-primary-fg));
	}
`;

export const TooltipLinkButton = (props: TooltipLinkButtonProps) => {
	const { children, ...otherProps } = props;
	return (
		<StyledButton variant="link" {...otherProps}>
			{children}
		</StyledButton>
	);
};
