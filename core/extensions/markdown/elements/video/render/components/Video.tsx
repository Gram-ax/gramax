import Skeleton from "@components/Atoms/ImageSkeleton";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
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
	const [isError, setIsError] = useState(!path?.length);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		setIsError(!path?.length);
	}, [path]);

	if (isPrint)
		return (
			<a data-type="video" href={path} rel="noreferrer" target="_blank">
				{t("editor.video.name")}
				{title && !noEm && <span>:{title}</span>}
			</a>
		);

	return (
		<div className={className} data-type="video">
			<BlockCommentView commentId={commentId}>
				<Skeleton height="100%" isLoaded={isError || isLoaded} style={{ height: "100%" }} width="100%">
					{isError ? (
						<>
							<ErrorVideo isLink isNoneError={!path} link={path} />
							{!path && title && !noEm && <em>{title}</em>}
						</>
					) : (
						<>
							<RenderVideo setIsError={setIsError} setIsLoaded={setIsLoaded} url={path} />
							{title && !noEm && <em>{title}</em>}
						</>
					)}
				</Skeleton>
			</BlockCommentView>
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
