import Icon from "@components/Atoms/Icon";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import isNavigatorAvailable from "@core-ui/isNavigatorAvailable";
import useGetHref from "@core-ui/useGetHref";
import { tryCopyToClipboard } from "@core-ui/utils/clipboard";
import styled from "@emotion/styled";
import React, { type MouseEvent, type ReactNode, useCallback } from "react";

export interface HeaderProps {
	level: number;
	id?: string;
	children?: ReactNode;
	copyLinkIcon?: boolean;
	className?: string;
	dataQa?: string;
	isPrint?: boolean;
}

const Header = (props: HeaderProps) => {
	const { level, id, children, className, dataQa, copyLinkIcon = true, isPrint } = props;
	const copyAllowed = isNavigatorAvailable();
	const hash = id ? `#${id}` : "";
	const href = useGetHref(hash);
	const articleProps = ArticlePropsService.value;

	const onClickHandler = useCallback(
		(e: MouseEvent<HTMLAnchorElement>) => {
			if (!copyAllowed) return;
			e.preventDefault();
			const clipboardLink = window.location.origin + window.location.pathname + hash;
			void tryCopyToClipboard(clipboardLink);
		},
		[copyAllowed, hash],
	);

	const headerId = !isPrint ? id : articleProps.logicPath + hash;

	const header = (
		<>
			{children}
			{copyLinkIcon && !!children && (
				<a className="anchor" contentEditable={false} data-mdignore={true} href={href} onClick={onClickHandler}>
					<Icon className="link-icon" code="link" />
				</a>
			)}
		</>
	);

	return React.createElement(`h${level}`, { id: headerId, className, "data-qa": dataQa }, header);
};

const getFontSize = (level: number) => {
	return {
		1: "2em",
		2: "1.6em",
		3: "1.3em",
		4: "1.1em",
		5: "1em",
		6: "1em",
	}[level];
};

const getLineHeight = (level: number) => {
	return {
		1: "1.3",
		2: "1.5",
		3: "1.6",
		4: "1.6",
	}[level];
};

export default styled(Header)`
	${({ level }) => {
		return `
		font-size: ${getFontSize(level) ?? "1em"};
		font-weight: ${level === 1 ? "700" : "400"};
		line-height: ${getLineHeight(level) ?? "1.6"};
		`;
	}}

	:hover > a.anchor {
		opacity: 0.5;
	}
	:hover > a.anchor:hover {
		opacity: 1;
		text-decoration: none;
	}

	> a.anchor {
		opacity: 0;
		line-height: inherit;
		color: var(--color-article-text) !important;
	}

	sup {
		a.anchor {
			font-weight: inherit;
			color: var(--color-link);
		}
	}
`;
