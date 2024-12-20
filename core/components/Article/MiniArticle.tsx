import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import type { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import Header from "@ext/markdown/elements/heading/render/component/Header";
import { useMemo, type ReactNode } from "react";

const MinimizedArticle = ({ className, children }: { className?: string; children: ReactNode }) => {
	return <div className={className}>{children}</div>;
};

export const MinimizedArticleStyled = styled(MinimizedArticle)`
	h2 {
		font-size: 1.2em !important;
	}

	h3 {
		font-size: 1.1em !important;
	}

	h4,
	h5,
	h6 {
		font-size: 1em !important;
	}

	h2,
	h3,
	h4,
	h5,
	h6 {
		margin-top: 0.5em !important;
		margin-bottom: 0.25em !important;
	}

	blockquote {
		margin: 0.575em 0 !important;
	}

	table {
		padding: 0.5rem 0 !important;
	}

	.admonition {
		margin: 0.5em 0 !important;
	}

	img {
		margin: 0.5em auto !important;
		pointer-events: none !important;
	}

	ol > li::before {
		top: 0.23em !important;
		width: 18px !important;
		padding: 4px 0 !important;
	}

	pre,
	code,
	.diagram-background {
		margin: 1em 0 !important;
	}

	ol,
	ul,
	p {
		margin: 0 0 0.35em !important;
		line-height: 1.5em !important;
	}
`;

export type MiniArticleProps = {
	title: string;
	content: RenderableTreeNodes;
	className?: string;
};

const MiniArticle = ({ title, content, className }: MiniArticleProps) => {
	const renderedContent = useMemo(() => Renderer(content, { components: getComponents() }), [content]);
	return (
		<div className={classNames("article", {}, ["tooltip-size", className])}>
			<Header level={1} className={classNames("article-title", {}, ["link-popup-title"])} copyLinkIcon={false}>
				{title}
			</Header>
			<MinimizedArticleStyled>
				<div className={classNames("article-body", {}, ["popup-article"])}>{renderedContent}</div>
			</MinimizedArticleStyled>
		</div>
	);
};

export default MiniArticle;
