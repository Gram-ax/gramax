import { ModalWidth } from "@components/Layouts/Modal";
import styled from "@emotion/styled";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import React from "react";

export interface ConfirmProps {
	className?: string;
	closeConfirm?: () => void;
	saveConfirm?: () => void;
	forceCloseConfirm?: () => void;
	text?: string;
	title?: string;
}

const Confirm = (props: ConfirmProps) => {
	const { className, text, title, forceCloseConfirm, closeConfirm, saveConfirm } = props;

	return (
		<div className={className}>
			<div className="modalContainer" style={{ width: ModalWidth.default }}>
				<InfoModalForm
					actionButton={{ onClick: saveConfirm, text: t("save") }}
					closeButton={{ text: t("cancel") }}
					icon={{ code: "circle-alert", color: "var(--color-warning)" }}
					onCancelClick={closeConfirm}
					secondButton={{ onClick: forceCloseConfirm, text: t("dont-save") }}
					title={title}
				>
					<span>{text}</span>
				</InfoModalForm>
			</div>
		</div>
	);
};

export default styled(Confirm)`
	z-index: var(--z-index-article-confirm-modal);
	background-color: var(--color-modal-overlay-style-bg);
	position: fixed;
	width: 100vw;
	height: 100vh;

	.modalContainer {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
`;
