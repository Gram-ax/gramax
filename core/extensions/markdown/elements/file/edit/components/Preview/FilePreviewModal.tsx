import { DATA_QA_LIGHTBOX } from "@components/Atoms/Image/modalImage/MediaPreview";
import { classNames } from "@components/libs/classNames";
import type Path from "@core/FileProvider/Path/Path";
import styled from "@emotion/styled";
import { FilePreview, type FilePreviewProps } from "@ext/markdown/elements/file/edit/components/Preview/FilePreview";
import { Overlay } from "@ui-kit/Overlay";
import { type MouseEventHandler, type ReactElement, useCallback, useEffect, useState } from "react";
import { PreviewModalHeader } from "./PreviewModalHeader";

interface PreviewModalProps extends FilePreviewProps {
	path: Path;
	className?: string;
	openInSupportedApp?: () => void;
	onClose: () => void;
	onError?: (error: unknown) => void;
}

const PreviewModal = (props: PreviewModalProps): ReactElement => {
	const { className, onClose, file, path, openInSupportedApp, onError: onErrorProps } = props;
	const [isClosing, setClosing] = useState<boolean>(false);

	const closeModal = useCallback(
		(immediately?: boolean) => {
			if (immediately) return onClose();
			setClosing(true);
			onClose?.();
		},
		[onClose],
	);

	const onClick: MouseEventHandler<HTMLDivElement> = useCallback(
		(event) => {
			const target = event.target as HTMLElement;
			if (target.classList.contains("data-close")) return closeModal();
		},
		[closeModal],
	);

	const onKeyDown = useCallback(
		(ev: KeyboardEvent) => {
			if (ev.key === "Escape") closeModal();
		},
		[closeModal],
	);

	useEffect(() => {
		window.addEventListener("keydown", onKeyDown);

		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [onKeyDown]);

	const onError = useCallback(
		(error: unknown) => {
			closeModal();
			onErrorProps?.(error);
		},
		[onErrorProps, closeModal],
	);

	return (
		<div className={className} data-qa={DATA_QA_LIGHTBOX} onClick={onClick}>
			<div className={classNames("animated-container", { "data-open": !isClosing, "data-closed": isClosing })}>
				<Overlay
					className={classNames("modal-background", {}, ["data-close"])}
					data-state={isClosing ? "closed" : "open"}
				/>
				<PreviewModalHeader closeModal={closeModal} openInSupportedApp={openInSupportedApp} path={path} />
				<div className="file-preview-modal">
					<FilePreview file={file} onError={onError} />
				</div>
			</div>
		</div>
	);
};

export default styled(PreviewModal)`
	z-index: var(--z-index-overlay);
	position: fixed;
	display: flex;
	justify-content: center;
	align-items: center;
	pointer-events: auto;
	width: 100vw;
	height: 100vh;
	left: 0;
	top: 0;

	.file-preview-modal {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		overflow: auto;
		width: 210mm;
		height: 297mm;
		max-height: 95vh;
		z-index: var(--z-index-overlay);
	}

	.modal-background {
		z-index: var(--z-index-overlay);
	}

	.data-open {
		animation: open 200ms forwards;
	}

	.data-closed {
		animation: close 200ms forwards;
	}

	@keyframes open {
		0% {
			opacity: 0;
			pointer-events: none;
		}
		100% {
			opacity: 1;
			pointer-events: auto;
		}
	}

	@keyframes close {
		0% {
			opacity: 1;
			pointer-events: auto;
		}
		100% {
			opacity: 0;
			pointer-events: none;
		}
	}
`;
