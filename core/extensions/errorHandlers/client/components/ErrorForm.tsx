import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import FormStyle from "@components/Form/FormStyle";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { Property } from "csstype";
import { ReactNode } from "react";
import useLocalize from "../../../localization/useLocalize";

const InfoModalForm = ({
	title,
	children,
	onCancelClick,
	isWarning = false,
	icon,
	actionButton,
	secondButton,
	closeButton,
	noButtons,
}: {
	title: string;
	children: ReactNode;
	onCancelClick: () => void;
	isWarning?: boolean;
	icon?: { color?: Property.Color; code: string };
	actionButton?: { text: string; onClick: () => void };
	secondButton?: { text: string; onClick: () => void };
	closeButton?: { text: string };
	noButtons?: boolean;
}) => {
	const closeText = useLocalize("close");
	const cancelText = useLocalize("cancel");
	return (
		<ModalLayoutLight>
			<FormStyle>
				<>
					<legend
						data-qa={`qa-${isWarning ? "" : "error-"}info-modal`}
						style={{ display: "flex", alignItems: "center" }}
					>
						{icon && <Icon style={{ color: icon.color }} code={icon.code} />}
						<span className="min">{title}</span>
					</legend>
					{children}
					<div className="form-group field field-string" />
					{!noButtons && (
						<div className="buttons">
							<Button
								onClick={onCancelClick}
								buttonStyle={actionButton ? ButtonStyle.underline : ButtonStyle.default}
							>
								{closeButton?.text ?? (actionButton ? cancelText : closeText)}
							</Button>
							{secondButton && (
								<Button
									buttonStyle={ButtonStyle.underline}
									className="custom-button"
									onClick={secondButton.onClick}
								>
									{secondButton.text}
								</Button>
							)}
							{actionButton && (
								<Button className="custom-button" onClick={actionButton.onClick}>
									{actionButton.text}
								</Button>
							)}
						</div>
					)}
				</>
			</FormStyle>
		</ModalLayoutLight>
	);
};

export default InfoModalForm;
