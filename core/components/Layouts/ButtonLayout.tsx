import styled from "@emotion/styled";
import { HTMLAttributes } from "react";

const ButtonsLayout = styled(({ children, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element => {
	return <div {...props}>{children}</div>;
})`
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
		padding: 0px 5.5px;
	}
`;

export default ButtonsLayout;
