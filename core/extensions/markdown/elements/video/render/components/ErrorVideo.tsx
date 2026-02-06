import AlertError from "@components/AlertError";
import { classNames } from "@components/libs/classNames";
import { cssMedia } from "@core-ui/utils/cssUtils";
import scrollUtils from "@core-ui/utils/scrollUtils";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { useEffect, useRef, useState } from "react";
import Note, { NoteType } from "../../../note/render/component/Note";
import ErrorText from "./ErrorText";

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
		return <AlertError error={{ message: t("alert.video.path") }} title={t("alert.video.unavailable")} />;

	return (
		<div className={"error-video " + className}>
			<video
				className="video-js"
				controls
				data-focusable="true"
				data-setup="{}"
				id="my-player"
				preload="auto"
				src={link}
			/>
			<div className={classNames("error-text-parent", { noScroll: !errorTextHasScroll })} ref={ref}>
				<Note title={t("editor.video.will-be-here")} type={NoteType.info}>
					<ErrorText isLink={isLink} isNoneError={isNoneError} link={link} />
				</Note>
			</div>
		</div>
	);
};

export default styled(ErrorVideo)`
	position: relative;
	aspect-ratio: 16/9;

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
