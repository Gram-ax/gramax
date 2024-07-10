import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { HTMLAttributes, forwardRef, MutableRefObject } from "react";

export enum LinkTheme {
	INHERIT = "inherit",
	PRIMARY = "primary",
	DISABLED = "disabled",
}

export interface PureLinkProps extends HTMLAttributes<HTMLAnchorElement> {
	target?: "_self" | "_blank" | "_parent" | "_top";
	linkTheme?: LinkTheme;
	href?: string;
}

const PureLink = forwardRef((props: PureLinkProps, ref: MutableRefObject<HTMLAnchorElement>) => {
	const { target = "_blank", linkTheme, rel = "noreferrer", children, className, ...otherProps } = props;

	return (
		<a target={target} ref={ref} rel={rel} className={classNames(className, {}, [linkTheme])} {...otherProps}>
			{children}
		</a>
	);
});

export default styled(PureLink)`
	&.inherit {
		margin: 0;
		padding: 0;

		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;

		color: inherit;
		cursor: inherit;
		text-align: inherit;
		text-decoration: inherit;
	}
`;
