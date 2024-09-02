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
			<span className={"icon-link-text"}>{text}</span>
			<span>{isExternal && <Icon code={"external-link"} className={"link-icon"} />}</span>
		</PureLink>
	);
};

export default styled(IconLink)`
	display: flex;
	align-items: center;
	line-height: 1em;

	.icon-link-text {
		padding-left: var(--distance-i-span);
	}
`;
