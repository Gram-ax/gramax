import styled from "@emotion/styled";
import { HTMLAttributes } from "react";
import Button from "./Base";

const Purple = styled(
	({
		children,
		className,
		...props
	}: {
		children: JSX.Element | string;
		className?: string;
	} & HTMLAttributes<HTMLDivElement>) => {
		return (
			<div className={className}>
				<div className="bottom-merge-button">
					<Button {...props}>
						<>{children}</>
					</Button>
				</div>
			</div>
		);
	},
)`
	width: fit-content;

	.bottom-merge-button {
		width: fit-content;
		background: var(--merger-bottom-primary);
		color: white;
		border-radius: var(--radius-block);
	}
	.bottom-merge-button > i::after {
		opacity: 1;
	}

	.bottom-merge-button:hover {
		text-decoration: none !important;
		color: #d338f8 !important;
		background: white;
	}
`;

export default Purple;
