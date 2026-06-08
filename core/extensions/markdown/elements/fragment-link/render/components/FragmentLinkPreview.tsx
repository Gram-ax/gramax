import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import { classNames } from "@components/libs/classNames";
import Header from "@ext/markdown/elements/heading/render/components/Header";
import type { ReactNode } from "react";

interface FragmentLinkPreviewProps {
	title?: string;
	children?: ReactNode;
}

const FragmentLinkPreview = ({ title, children }: FragmentLinkPreviewProps) => (
	<div className={classNames("article", {}, ["tooltip-size"])}>
		{title && (
			<Header className={classNames("article-title", {}, ["link-popup-title"])} copyLinkIcon={false} level={1}>
				{title}
			</Header>
		)}
		<MinimizedArticleStyled>
			<div className={classNames("article-body", {}, ["popup-article"])}>{children}</div>
		</MinimizedArticleStyled>
	</div>
);

export default FragmentLinkPreview;
