import Checkbox from "@components/Atoms/Checkbox";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { cloneElement, useCallback, useState } from "react";

const localStorage = typeof window !== "undefined" ? window.localStorage : null;

export type ActionConfirmProps = {
	children?: JSX.Element;
	initialIsOpen?: boolean;

	onConfirm?: () => void;
	onClose?: () => void;

	confirmTitle: string;
	confirmBody: React.ReactNode | string;

	confirmText?: string;
	cancelText?: string;

	shouldShow?: () => boolean;
	doNotShowAgainKey?: string;

	className?: string;
};

export type ActionWarningProps = {
	children?: JSX.Element;
	action: (...args: any[]) => void;
	catalogProps: ClientCatalogProps;
	isDelete?: boolean;
	onClose?: () => void;
	isOpen?: boolean;
	className?: string;
};

const WarningUnstyled = ({
	body,
	className,
	setDoNotShowAgain,
}: {
	body: React.ReactNode | string;
	className?: string;
	setDoNotShowAgain?: (flag: boolean) => void;
}) => {
	return (
		<div className={className}>
			<p>{body}</p>
			{setDoNotShowAgain && (
				<p>
					<Checkbox onChange={setDoNotShowAgain}>{t("do-not-show-again")}</Checkbox>
				</p>
			)}
		</div>
	);
};

const Warning = styled(WarningUnstyled)`
	> p {
		margin: 0.5em 0px;
	}
`;

const ActionConfirm = (props: ActionConfirmProps) => {
	const {
		children,
		initialIsOpen,
		onConfirm,
		onClose,
		confirmTitle: title,
		confirmBody: body,
		confirmText = t("continue"),
		cancelText = t("cancel"),
		shouldShow,
		doNotShowAgainKey,
		className,
	} = props;

	const initialDoNotShow = !!localStorage?.getItem(doNotShowAgainKey);

	const [isOpen, setIsOpen] = useState(initialIsOpen);
	const [doNotShowAgain, setDoNotShowAgain] = useState(initialDoNotShow);

	const onConfirmClick = useCallback(() => {
		setIsOpen(false);
		if (doNotShowAgainKey) {
			doNotShowAgain
				? localStorage?.setItem(doNotShowAgainKey, "1")
				: localStorage?.removeItem(doNotShowAgainKey);
		}
		onConfirm?.();
	}, [doNotShowAgain, doNotShowAgainKey, onConfirm]);

	if (initialDoNotShow || (shouldShow && !shouldShow())) {
		if (!children) {
			onConfirm?.();
			onClose?.();
			return null;
		}

		return cloneElement(children, { onClick: onConfirm });
	}

	return (
		<Modal
			closeOnEscape
			contentWidth="XS"
			isOpen={isOpen}
			onOpen={() => setIsOpen(true)}
			onClose={() => {
				setIsOpen(false);
				onClose?.();
			}}
			trigger={children}
		>
			<ModalLayoutLight className={className}>
				<InfoModalForm
					isWarning
					onCancelClick={() => setIsOpen(false)}
					title={title}
					actionButton={{
						text: confirmText,
						onClick: onConfirmClick,
					}}
					closeButton={{ text: cancelText }}
					icon={{ code: "alert-circle", color: "var(--color-warning)" }}
				>
					<Warning body={body} setDoNotShowAgain={doNotShowAgainKey ? setDoNotShowAgain : null} />
				</InfoModalForm>
			</ModalLayoutLight>
		</Modal>
	);
};

export default ActionConfirm;
