import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { ReactNode } from "react";

interface ArticlePreviewProps extends React.HTMLAttributes<HTMLDivElement> {
	mainArticle: ReactNode;
	previewArticle?: ReactNode;
	className?: string;
}

const ArticleWithPreviewArticle = ({ mainArticle, previewArticle, className, ...props }: ArticlePreviewProps) => {
	return (
		<div
			className={classNames("article-page-wrapper", { ["preview-style"]: !!previewArticle }, [className])}
			{...props}
		>
			<div className="main-article">{mainArticle}</div>
			{previewArticle && <div className="preview-article">{previewArticle}</div>}
		</div>
	);
};

export default styled(ArticleWithPreviewArticle)`
	flex: 1 1 0px;
	display: flex;
	gap: 1rem;
	flex-direction: row;
	margin-top: -0.1rem;

	div.main-article {
		width: 100%;
	}

	&.preview-style > div.main-article {
		width: 67%;
		position: relative;
	}

	div.preview-article {
		position: sticky;
		top: 0;
		opacity: 0.6;
		max-width: 28%;
		min-width: 28%;
		font-size: 10px;
		max-height: 100vh;
		overflow-y: auto;
		transition: opacity 0.3s linear;

		:hover {
			opacity: 1;
		}
	}
`;
