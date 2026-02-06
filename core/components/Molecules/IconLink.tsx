import Icon from "@components/Atoms/Icon";
import PureLink, { LinkTheme, PureLinkProps } from "@components/Atoms/PureLink";
import styled from "@emotion/styled";
import React from "react";

interface IconLinkProps extends PureLinkProps {
	afterIconCode?: string;
	isExternal?: boolean;
	text?: string;
}

const IconLink = (props: IconLinkProps) => {
	const { afterIconCode, isExternal, className, text, ...pureLinkProps } = props;

	return (
		<PureLink className={className} linkTheme={LinkTheme.INHERIT} {...pureLinkProps}>
			{afterIconCode && <Icon code={afterIconCode} fw />}
			<span className={"icon-link-text"}>{text}</span>
			<span>{isExternal && <Icon className={"link-icon"} code={"external-link"} />}</span>
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
