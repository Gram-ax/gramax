import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useState } from "react";
import Note, { NoteType } from "../../../note/render/component/Note";
import ErrorText from "./ErrorText";

const ErrorVideo = styled(
	({
		isLink,
		link,
		className,
		isNoneError = false,
	}: {
		isLink: boolean;
		link: string;
		className?: string;
		isNoneError?: boolean;
	}) => {
		const [showText, setShowText] = useState(false);

		return (
			<div className={"error-video " + className}>
				<video
					id="my-player"
					data-focusable="true"
					className="video-js"
					controls
					preload="auto"
					data-setup="{}"
					src={link}
					onError={() => setShowText(true)}
				/>
				{showText ? (
					<div className="error-text-parent">
						<Note type={NoteType.info} title={isNoneError ? "Тут будет ваше видео" : "Видео недоступно"}>
							<ErrorText link={link} isLink={isLink} isNoneError={isNoneError} />
						</Note>
					</div>
				) : null}
			</div>
		);
	},
)`
	position: relative;

	${cssMedia.narrow} {
		height: 394px;
	}

	.error-text-parent {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		display: flex;
		align-items: center;
		justify-content: center;

		> div {
			max-width: 665px;
		}
		.admonition {
			border: none;
			background: transparent;

			* {
				color: var(--color-article-text-dark-theme) !important;
			}

			a {
				color: var(--color-link-dark-theme) !important;
			}
		}
	}
`;

export default ErrorVideo;
