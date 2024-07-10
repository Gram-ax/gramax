import Icon from "@components/Atoms/Icon";
import PureLink, { PureLinkProps, LinkTheme } from "@components/Atoms/PureLink";
import React from "react";
import styled from "@emotion/styled";

interface IconLinkProps extends PureLinkProps {
	afterIconCode?: string;
	isExternal?: boolean;
	text?: string;
}

const IconLink = (props: IconLinkProps) => {
	const { afterIconCode, isExternal, className, text, ...pureLinkProps } = props;

	return (
		<PureLink className={className} linkTheme={LinkTheme.INHERIT} {...pureLinkProps}>
			{afterIconCode && <Icon fw code={afterIconCode} />}
			{text}
			{isExternal && <Icon code={"external-link"} className={"text_xx_small"} />}
		</PureLink>
	);
};

export default styled(IconLink)`
	display: flex;
	align-items: center;
	line-height: 1em;

	gap: var(--distance-i-span);

	.text_xx_small {
		font-size: 0.6rem;
	}
`;
