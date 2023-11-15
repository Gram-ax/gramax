import styled from "@emotion/styled";
import { HTMLAttributes } from "react";
import Button from "./Base";

const Orange = styled(({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => {
	return (
		<div className={className}>
			<div className="orange-button">
				<Button {...props}>
					<>{children}</>
				</Button>
			</div>
		</div>
	);
})`
	width: fit-content;

	.orange-button {
		width: fit-content;
		background: var(--color-btn-bg);
		color: var(--color-text-accent) !important;
		border: 1px solid var(--color-text-accent);
		border-radius: var(--radius-block);
	}
	.orange-button > i::after {
		opacity: 1;
	}

	.orange-button:hover {
		text-decoration: none !important;
		color: white !important;
		background: var(--color-text-accent);
	}
`;

export default Orange;
