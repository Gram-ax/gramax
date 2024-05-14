import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import React from "react";

export interface HeaderProps {
	level: number;
	id?: string;
	children?: any;
	copyLinkIcon?: boolean;
	className?: string;
	dataQa?: string;
}

const Header = (props: HeaderProps) => {
	const { level, id, children, className, dataQa, copyLinkIcon = true } = props;
	const href = id ? `#${id}` : "";
	const header = (
		<>
			{children}
			{copyLinkIcon && (
				<a
					href={href}
					className="anchor"
					data-mdignore={true}
					contentEditable={false}
					onClick={(e) => {
						if (!href.length) e.preventDefault();
						navigator.clipboard.writeText(`${window.location.href}${href}`);
					}}
				>
					<Icon code="link" />
				</a>
			)}
		</>
	);
	return React.createElement("h" + level, { id, className, "data-qa": dataQa }, header);
};

export default styled(Header)`
	:hover > a.anchor {
		opacity: 0.5;
	}
	:hover > a.anchor:hover {
		opacity: 1;
	}

	> a.anchor {
		opacity: 0;
		font-size: 0.9em;
		line-height: inherit;
		margin-left: var(--distance-i-span);
		color: var(--color-article-text) !important;
	}

	sup {
		a.anchor {
			font-weight: inherit;
			color: var(--color-link);
		}
	}
`;
