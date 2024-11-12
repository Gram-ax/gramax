import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

export type ActionWarningProps = {
	action: (...args: any[]) => void;
	children?: JSX.Element;
	isCatalog?: boolean;
	onClose?: () => void;
	isOpen?: boolean;
	className?: string;
};

const ActionWarning = ({ children, action, onClose, isCatalog, isOpen: initialIsOpen }: ActionWarningProps) => {
	const [isOpen, setIsOpen] = useState(initialIsOpen);

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
			<ModalLayoutLight>
				<InfoModalForm
					isWarning
					onCancelClick={() => setIsOpen(false)}
					title={
						isCatalog
							? t("properties.warning.delete-tag-from-catalog.title")
							: t("properties.warning.delete-value-from-catalog.title")
					}
					actionButton={{
						text: t("continue"),
						onClick: () => {
							setIsOpen(false);
							action();
						},
					}}
					secondButton={!isCatalog && { text: t("properties.archive"), onClick: () => action(true) }}
					closeButton={{ text: t("cancel") }}
					icon={{ code: "alert-circle", color: "var(--color-warning)" }}
				>
					<p>
						{isCatalog
							? t("properties.warning.delete-tag-from-catalog.body")
							: t("properties.warning.delete-value-from-catalog.body")}
					</p>
				</InfoModalForm>
			</ModalLayoutLight>
		</Modal>
	);
};

export default ActionWarning;
