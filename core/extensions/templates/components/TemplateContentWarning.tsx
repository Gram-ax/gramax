import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

export interface TemplateContentWarningProps {
	initialIsOpen: boolean;
	action: () => void;
	onClose?: () => void;
	templateName: string;
}

const TemplateContentWarning = ({ initialIsOpen, onClose, action, templateName }: TemplateContentWarningProps) => {
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
		>
			<ModalLayoutLight>
				<InfoModalForm
					isWarning
					onCancelClick={() => setIsOpen(false)}
					title={t("template.warning.content.name").replace("{{template}}", templateName)}
					actionButton={{
						text: t("continue"),
						onClick: () => {
							setIsOpen(false);
							action();
						},
					}}
					closeButton={{ text: t("cancel") }}
					icon={{ code: "alert-circle", color: "var(--color-warning)" }}
				>
					{t("template.warning.content.body")}
				</InfoModalForm>
			</ModalLayoutLight>
		</Modal>
	);
};

export default TemplateContentWarning;
