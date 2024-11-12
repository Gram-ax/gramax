import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import Note, { NoteType } from "../../../note/render/component/Note";
import ErrorText from "./ErrorText";
import AlertError from "@components/AlertError";
import { useEffect, useRef, useState } from "react";
import scrollUtils from "@core-ui/utils/scrollUtils";
import { classNames } from "@components/libs/classNames";

interface ErrorVideoProps {
	isLink: boolean;
	link: string;
	className?: string;
	isNoneError?: boolean;
}

const ErrorVideo = ({ isLink, link, className, isNoneError = false }: ErrorVideoProps) => {
	const ref = useRef(null);
	const [errorTextHasScroll, setErrorTextHasScroll] = useState(false);

	useEffect(() => {
		const element = ref.current;

		if (element) {
			const resizeObserver = new ResizeObserver(() => {
				setErrorTextHasScroll(scrollUtils.hasScroll(element));
			});

			resizeObserver.observe(element);

			return () => resizeObserver.disconnect();
		}
	}, []);

	if (!isNoneError)
		return <AlertError title={t("alert.video.unavailable")} error={{ message: t("alert.video.path") }} />;

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
			/>
			<div ref={ref} className={classNames("error-text-parent", { noScroll: !errorTextHasScroll })}>
				<Note type={NoteType.info} title={t("editor.video.will-be-here")}>
					<ErrorText link={link} isLink={isLink} isNoneError={isNoneError} />
				</Note>
			</div>
		</div>
	);
};

export default styled(ErrorVideo)`
	position: relative;

	${cssMedia.narrow} {
		height: 394px;
	}

	.error-text-parent {
		overflow: auto;
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
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

		&.noScroll {
			display: flex;
			align-items: center;
		}
	}
`;
