import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import FormStyle from "@components/Form/FormStyle";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { Property } from "csstype";
import { ReactNode } from "react";
import useLocalize from "../../../localization/useLocalize";

const ErrorForm = ({
	title,
	children,
	onCancelClick,
	icon,
	actionButton,
	closeButton,
}: {
	title: string;
	children: ReactNode;
	onCancelClick: () => void;
	icon?: { color?: Property.Color; code: string };
	actionButton?: { text: string; onClick: () => void };
	closeButton?: { text: string };
}) => {
	const closeText = useLocalize("close");
	const cancelText = useLocalize("cancel");
	return (
		<ModalLayoutLight>
			<FormStyle>
				<>
					<legend data-qa="qa-error-modal">
						{icon && <Icon style={{ color: icon.color }} code={icon.code} />}
						<span className="min">{title}</span>
					</legend>
					{children}
					<div className="form-group field field-string" />
					<div className="buttons">
						<Button
							onClick={onCancelClick}
							buttonStyle={actionButton ? ButtonStyle.transparent : ButtonStyle.default}
						>
							{closeButton?.text ?? (actionButton ? cancelText : closeText)}
						</Button>
						{actionButton && (
							<Button className="custom-button" onClick={actionButton.onClick}>
								{actionButton.text}
							</Button>
						)}
					</div>
				</>
			</FormStyle>
		</ModalLayoutLight>
	);
};

export default ErrorForm;
