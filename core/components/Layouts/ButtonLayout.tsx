import styled from "@emotion/styled";
import { HTMLAttributes, MutableRefObject, forwardRef } from "react";

const ButtonsLayout = forwardRef(
	({ children, ...props }: HTMLAttributes<HTMLDivElement>, ref?: MutableRefObject<HTMLDivElement>): JSX.Element => {
		return (
			<div ref={ref} {...props}>
				{children}
			</div>
		);
	},
);

export default styled(ButtonsLayout)`
	gap: 4px;
	display: flex;
	align-items: center;
	flex-direction: row;

	div.divider {
		padding: 0;
		height: 15px;
		margin: 4px 0;
		border-left: 1px solid var(--color-edit-menu-button-active-bg);
	}

	> div > input {
		padding: 0 5.5px;
	}
`;
