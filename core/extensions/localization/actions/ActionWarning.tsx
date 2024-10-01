import Checkbox from "@components/Atoms/Checkbox";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { cloneElement, useState } from "react";

const DO_NOT_SHOW_AGAIN = "languages.skip-warn";
const localStorage = typeof window !== "undefined" ? window.localStorage : null;

export const shouldShowActionWarning = (catalogProps: ClientCatalogProps) =>
	catalogProps?.supportedLanguages?.length > 1 && !localStorage?.getItem(DO_NOT_SHOW_AGAIN);

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
	isDelete,
	className,
	setDoNotShowAgain,
}: {
	isDelete?: boolean;
	className?: string;
	setDoNotShowAgain: (flag: boolean) => void;
}) => {
	return (
		<div className={className}>
			<p>{isDelete ? t("multilang.warning.delete.body") : t("multilang.warning.action.body")}</p>
			<p>
				<Checkbox onChange={setDoNotShowAgain}>{t("do-not-show-again")}</Checkbox>
			</p>
		</div>
	);
};

const Warning = styled(WarningUnstyled)`
	> p {
		margin: 0.5em 0px;
	}
`;

const ActionWarning = ({
	children,
	action,
	catalogProps,
	onClose,
	isDelete,
	isOpen: initialIsOpen,
	className,
}: ActionWarningProps) => {
	const [isOpen, setIsOpen] = useState(initialIsOpen);
	const [doNotShowAgain, setDoNotShowAgain] = useState(!!localStorage?.getItem(DO_NOT_SHOW_AGAIN));

	if (!shouldShowActionWarning(catalogProps)) {
		if (!children) {
			action();
			return null;
		}

		return cloneElement(children, { onClick: action });
	}

	return (
		<Modal
			closeOnEscape
			contentWidth="S"
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
					title={isDelete ? t("multilang.warning.delete.title") : t("multilang.warning.action.title")}
					actionButton={{
						text: t("continue"),
						onClick: () => {
							setIsOpen(false);
							action();
							doNotShowAgain
								? localStorage?.setItem(DO_NOT_SHOW_AGAIN, "1")
								: localStorage?.removeItem(DO_NOT_SHOW_AGAIN);
						},
					}}
					closeButton={{ text: t("cancel") }}
					icon={{ code: "alert-circle", color: "var(--color-warning)" }}
				>
					<Warning isDelete={isDelete} setDoNotShowAgain={setDoNotShowAgain} />
				</InfoModalForm>
			</ModalLayoutLight>
		</Modal>
	);
};

export default styled(ActionWarning)`
	width: fit-content;
`;
