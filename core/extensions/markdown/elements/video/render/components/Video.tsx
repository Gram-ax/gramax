import { useEffect, useState } from "react";
import RenderVideo from "./RenderVideo";
import ErrorVideo from "@ext/markdown/elements/video/render/components/ErrorVideo";
import Skeleton from "@components/Atoms/Skeleton";

const Video = ({ path, title, noEm }: { path: string; title: string; noEm?: boolean }) => {
	const [isError, setIsError] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		setIsError(false);
	}, [path]);

	return (
		<div data-type="video">
			<Skeleton isLoaded={isError || isLoaded} width="100%" height="480px">
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
			</Skeleton>
		</div>
	);
};

export default Video;
