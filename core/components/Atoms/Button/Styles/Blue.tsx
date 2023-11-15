import styled from "@emotion/styled";
import { HTMLAttributes, ReactNode } from "react";
import Button from "./Base";

const Blue = styled(
	({
		children,
		className,
		...props
	}: {
		children: ReactNode;
		className?: string;
	} & HTMLAttributes<HTMLDivElement>) => {
		return (
			<div className={className}>
				<div className="top-merge-button">
					<Button {...props}>
						<>{children}</>
					</Button>
				</div>
			</div>
		);
	},
)`
	width: fit-content;

	.top-merge-button {
		width: fit-content;
		background: var(--merger-top-primary);
		color: white;
		border-radius: var(--radius-block);
	}
	.top-merge-button > i::after {
		opacity: 1;
	}

	.top-merge-button:hover {
		text-decoration: none !important;
		color: #3a9ffb !important;
		background: white;
	}
`;

export default Blue;
