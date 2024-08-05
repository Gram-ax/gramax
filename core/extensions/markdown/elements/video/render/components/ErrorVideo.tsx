import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import Note, { NoteType } from "../../../note/render/component/Note";
import ErrorText from "./ErrorText";
import AlertError from "@components/AlertError";

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
		return isNoneError ? (
			<div className={"error-video " + className}>
				<video
					id="my-player"
					data-focusable="true"
					className="video-js"
					controls
					preload="auto"
					data-setup="{}"
					src={link}
				/>
				<div className="error-text-parent">
					<Note type={NoteType.info} title={t("editor.video.will-be-here")}>
						<ErrorText link={link} isLink={isLink} isNoneError={isNoneError} />
					</Note>
				</div>
			</div>
		) : (
			<AlertError title={t("alert.video.unavailable")} error={{ message: t("alert.video.path") }} />
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
