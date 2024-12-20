import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { ReactNode } from "react";

interface ArticlePreviewProps {
	mainArticle: ReactNode;
	previewArticle?: ReactNode;
	className?: string;
}

const ArticleWithPreviewArticle = (props: ArticlePreviewProps) => {
	const { mainArticle, previewArticle, className } = props;
	return (
		<div className={classNames("article-page-wrapper", { ["preview-style"]: !!previewArticle }, [className])}>
			<div className="main-article">{mainArticle}</div>
			{previewArticle && <div className="preview-article">{previewArticle}</div>}
		</div>
	);
};

export default styled(ArticleWithPreviewArticle)`
	flex: 1 1 0px;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	margin-top: -0.1rem;

	div.main-article {
		width: 100%;
	}

	&.preview-style > div.main-article {
		max-width: 69.5%;
		min-width: 69.5%;
	}

	div.preview-article {
		opacity: 0.6;
		max-width: 30%;
		min-width: 30%;
		font-size: 10px;
		overflow-y: auto;
		transition: opacity 0.3s linear;

		:hover {
			opacity: 1;
		}
	}
`;
