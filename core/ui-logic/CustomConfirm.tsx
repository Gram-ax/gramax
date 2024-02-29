import styled from "@emotion/styled";
import { confirmAlert } from "react-confirm-alert";
import Button from "../components/Atoms/Button/Button";
import { ButtonStyle } from "../components/Atoms/Button/ButtonStyle";

// понять, почему после закрытия конфирма, при клике на модальное окно, оно закрывается?

const customConfirm = (message: string, title?: string): Promise<boolean> => {
	return new Promise((resolve) => {
		customConfirmWithCallback(message, title, (answer: boolean) => {
			resolve(answer);
		});
	});
};

const customConfirmWithCallback = (message: string, title?: string, onAnswer?: (answer: boolean) => void) => {
	confirmAlert({
		title,
		message,
		customUI: ({ title, message, onClose }) => (
			<ConfirmComponent title={title} message={message} onAnswer={onAnswer} onClose={onClose} />
		),
	});
};

const ConfirmComponent = styled(
	({
		title,
		message,
		onClose,
		onAnswer,
		className,
	}: {
		title: string;
		message: string;
		onClose: () => void;
		onAnswer?: (answer: boolean) => void;
		className?: string;
	}) => {
		return (
			<div className={className + " modal"}>
				<div className="custom-confirm">
					<div className="top-content block-elevation-2">
						<div className="form small-code article block-elevation-3">
							{title ? <h2>{title}</h2> : null}
							<span>{message}</span>
							<div className="alert-buttons">
								<Button
									buttonStyle={ButtonStyle.underline}
									onClick={() => {
										if (onAnswer) onAnswer(false);
										onClose();
									}}
								>
									Cancel
								</Button>
								<Button
									onClick={() => {
										if (onAnswer) onAnswer(true);
										onClose();
									}}
								>
									Ok
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	},
)`
	height: 100%;
	width: 100%;
	position: absolute;
	inset: 0px;
	z-index: 99999;
	display: flex;
	justify-content: center;
	align-items: center;

	.custom-confirm {
		min-width: 30%;
		max-width: 50%;
	}

	h2 {
		margin-top: 0;
	}

	.alert-buttons {
		gap: 1.2rem;
		display: flex;
		margin-top: 1rem;
		flex-direction: row;
		-webkit-box-pack: center;
		justify-content: flex-end;
	}
`;
export default customConfirm;
