import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useEffect, useRef, useState } from "react";
import Popup from "reactjs-popup";
import ErrorHandler from "../../extensions/errorHandlers/client/components/ErrorHandler";
import IsOpenModalService from "../../ui-logic/ContextServices/IsOpenMpdal";
import Icon from "../Atoms/Icon";

export interface ModalLayoutProps {
	children: JSX.Element;
	trigger?: JSX.Element;
	onOpen?: () => void;
	onClose?: (closeModal: () => void) => void;
	onEnter?: () => void;
	onCmdEnter?: (e: KeyboardEvent) => void;
	isOpen?: boolean;
	className?: string;
	contentWidth?: "S" | "M" | "L";
	closeOnEscape?: boolean;
	closeOnCmdEnter?: boolean;
	setGlobalsStyles?: boolean;
	disabled?: boolean;
	preventClose?: boolean;
}

const ModalLayout = (props: ModalLayoutProps) => {
	const {
		children,
		trigger,
		onOpen,
		onClose,
		onEnter,
		onCmdEnter,
		isOpen: isParentOpen,
		className,
		disabled,
		closeOnEscape = true,
		closeOnCmdEnter = true,
		preventClose = false,
	} = props;
	const [isOpen, setIsOpen] = useState(isParentOpen ?? false);
	const [closeOnDocumentClick, setCloseOnDocumentClick] = useState(true);
	const [mouseDownOnModal, setMouseDownOnModal] = useState(false);
	const shouldAbortOnClose = useRef(false);
	const needToCallOnClose = useRef(true);

	const closeModal = () => {
		setIsOpen(false);
		IsOpenModalService.value = false;
	};

	const tryClose = () => {
		onClose?.(() => {
			shouldAbortOnClose.current = true;
			closeModal();
		});
		if (preventClose) return;
		setIsOpen(false);
	};

	const keydownHandler = (e: KeyboardEvent) => {
		if (e.code === "Escape" && isOpen) {
			if (!closeOnEscape) return;
			tryClose();
		}
		if (e.code === "Enter" && isOpen && onEnter) onEnter();
		if (e.code === "Enter" && (e.ctrlKey || e.metaKey) && isOpen && onCmdEnter && closeOnCmdEnter) onCmdEnter(e);
	};

	const onCurrentClose = () => {
		needToCallOnClose.current = false;
		if (shouldAbortOnClose.current) {
			shouldAbortOnClose.current = false;
			return;
		}
		closeModal();
	};

	useEffect(() => {
		document.addEventListener("keydown", keydownHandler, false);
		return () => {
			document.removeEventListener("keydown", keydownHandler, false);
		};
	});

	useEffect(() => {
		return () => needToCallOnClose.current && onCurrentClose();
	}, []);

	useEffect(() => {
		if (isParentOpen) setIsOpen(true);
		else tryClose();
	}, [isParentOpen]);

	return (
		<Popup
			open={isOpen}
			onOpen={() => {
				onOpen?.();
				setIsOpen(true);
				IsOpenModalService.value = true;
			}}
			disabled={disabled}
			onClose={onCurrentClose}
			trigger={trigger}
			overlayStyle={{ backgroundColor: "var(--color-modal-overlay-style-bg)" }}
			contentStyle={{
				display: "flex",
				height: "100%",
				border: "none",
				background: "none",
				width: "100%",
			}}
			closeOnEscape={false}
			closeOnDocumentClick={true}
			modal
			nested
		>
			<div
				className={className}
				onMouseUp={() => {
					if (closeOnDocumentClick && !mouseDownOnModal) tryClose();
					setMouseDownOnModal(false);
				}}
				onMouseDown={() => {
					if (!closeOnDocumentClick) setMouseDownOnModal(true);
				}}
				data-qa={`modal-layout`}
			>
				<div className="x-mark">
					<Icon
						code="x"
						onMouseUp={(e) => {
							e.stopPropagation();
							tryClose();
						}}
					/>
				</div>
				<div
					className="outer-modal"
					onMouseEnter={() => {
						setCloseOnDocumentClick(false);
					}}
					onMouseLeave={() => {
						setCloseOnDocumentClick(true);
					}}
					onMouseDown={() => {
						setCloseOnDocumentClick(false);
					}}
				>
					<ErrorHandler>
						<>{children}</>
					</ErrorHandler>
					<div style={{ height: "100%" }} onClick={tryClose} />
				</div>
			</div>
		</Popup>
	);
};

export default styled(ModalLayout)`
	width: 100%;
	display: flex;

	.outer-modal {
		height: 80%;
		margin: auto;
		width: ${(p) => {
			if (!p.contentWidth) return "var(--default-form-width)";
			if (p.contentWidth === "S") return "45%";
			if (p.contentWidth === "M") return "60%";
			if (p.contentWidth === "L") return "80%";
		}};
		${cssMedia.mediumest} {
			width: 70% !important;
		}

		${cssMedia.medium} {
			width: 80% !important;
		}

		${cssMedia.narrow} {
			width: 98% !important;
		}
	}

	.x-mark {
		position: absolute;
		top: 0;
		right: 0;
		padding-top: 1.2em;
		padding-right: 1.2em;

		> i {
			cursor: pointer;
			transition: 0.25s;
			font-size: var(--big-icon-size);
			color: var(--color-active-white);

			:hover {
				color: var(--color-active-white-hover);
			}

			${cssMedia.narrow} {
				display: none;
			}
		}
	}

	${(p) =>
		p.setGlobalsStyles ?? false
			? `
	.global {
		gap: 1rem;
		display: flex;
		background: none;
		justify-content: flex-end;
	}

	h2,
	h3 {
		margin-top: 0 !important;
	}

	label {
		display: block;
		margin-bottom: 4px;
		color: var(--color-article-text);
	}
	label.margin-top {
		margin-top: 1rem;
	}

	.margin-bottom {
		margin-bottom: 1rem;
	}

	.btn {
		font-size: 1rem;
		justify-content: center;
	}
	.btn.disabled {
		pointer-events: none;
		opacity: 0.4;
	}

	.new-branch {
		height: 0;
		width: 100%;
		overflow-y: hidden;
		transition: all 0.3s;
		border-radius: var(--radius-normal);

		.new-branch-form {
			margin: 1rem;
			display: flex;
			background: none;
			align-content: center;
			flex-direction: column;
			justify-content: center;
			height: calc(100% - 2rem);

			label {
				a {
					color: var(--color-link) !important;
				}
				a:hover {
					text-decoration: underline !important;
				}
			}
		}
	}
	.new-branch.open-new-branch {
		height: 152px !important;
	}

	.bottom-content {
		height: 0%;
		margin-top: -1rem;
		transition: all 0.3s;
		padding: 0 !important;
		padding-top: 1rem !important;

		.status {
			height: calc(100% + 1rem);
			margin-top: -1rem !important;
			padding-top: 1rem !important;
			background: var(--color-code-bg) !important;

			pre.prism-code {
				height: 100%;
				overflow: auto;
				border-radius: 0;
				position: relative;
				margin: 0 !important;
				padding: 1rem !important;

				.hover-right-button {
					top: 1rem;
					right: 10px;
				}
			}
		}
	}

	.bottom-content.open-bottom-content {
		height: 100%;
	}
	`
			: ""}
`;
