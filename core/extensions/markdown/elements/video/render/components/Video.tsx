import { useEffect, useState } from "react";
import RenderVideo from "./RenderVideo";
import ErrorVideo from "@ext/markdown/elements/video/render/components/ErrorVideo";

const Video = ({ path, title }: { path: string; title: string }) => {
	const [isError, setIsError] = useState(false);

	useEffect(() => {
		setIsError(false);
	}, [path]);

	return (
		<div data-type="video">
			{isError ? (
				<>
					<ErrorVideo link={path} isLink isNoneError={!path} />
					{!path && title && <em>{title}</em>}
				</>
			) : (
				<>
					<RenderVideo url={path} setIsError={setIsError} />
					{title && <em>{title}</em>}
				</>
			)}
		</div>
	);
};

export default Video;
