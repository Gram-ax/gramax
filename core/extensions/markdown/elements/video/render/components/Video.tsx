import Skeleton from "@components/Atoms/ImageSkeleton";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/BlockCommentView";
import ErrorVideo from "@ext/markdown/elements/video/render/components/ErrorVideo";
import { useEffect, useState } from "react";
import RenderVideo from "./RenderVideo";

interface VideoProps {
	path: string;
	title: string;
	noEm?: boolean;
	className?: string;
	commentId?: string;
	isPrint?: boolean;
}

const Video = ({ path, title, noEm, className, commentId, isPrint }: VideoProps) => {
	const [isError, setIsError] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		setIsError(false);
	}, [path]);

	if (isPrint)
		return (
			<a href={path} target="_blank" rel="noreferrer" data-type="video">
				{t("editor.video.name")}
				{title && !noEm && <span>:{title}</span>}
			</a>
		);

	return (
		<div className={className} data-type="video">
			<Skeleton isLoaded={isError || isLoaded} width="100%">
				<BlockCommentView commentId={commentId}>
					{isError ? (
						<>
							<ErrorVideo link={path} isLink isNoneError={!path} />
							{!path && title && !noEm && <em>{title}</em>}
						</>
					) : (
						<>
							<RenderVideo url={path} setIsError={setIsError} setIsLoaded={setIsLoaded} />
							{title && !noEm && <em>{title}</em>}
						</>
					)}
				</BlockCommentView>
			</Skeleton>
		</div>
	);
};

export default styled(Video)`
	width: 100%;

	&:has(iframe) {
		height: 100%;
		aspect-ratio: 16/9;
		margin-bottom: 0.5em;

		> div {
			height: 100%;
		}
	}

	.error-text-parent {
		overflow: hidden;
	}

	> .skeleton {
		aspect-ratio: 16/9;
		height: 100%;
	}

	iframe {
		display: flex;
		height: 100%;
		width: 100%;
	}
`;
