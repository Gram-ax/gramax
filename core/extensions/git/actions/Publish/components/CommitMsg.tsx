import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Input from "@components/Atoms/Input";
import Notification from "@components/Atoms/Notification";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import useIsSourceDataValid from "@ext/storage/components/useIsSourceDataValid";
import InvalidSourceWarning from "@ext/storage/logic/SourceDataProvider/components/InvalidSourceWarning";
import { forwardRef, MutableRefObject } from "react";

const NotificationWrapper = styled.div`
	position: relative;
	margin-left: 0.5em;

	> div {
		position: static !important;
		font-size: 10px !important;
		> div {
			padding: 1px;
		}
	}
`;

interface PublishActionProps {
	commitMessageValue: string;
	commitMessagePlaceholder: string;
	disableCommitInput: boolean;
	disablePublishButton: boolean;
	fileCount: number;
	isLoading?: boolean;
	onPublishClick: () => Promise<void> | void;
	onCommitMessageChange: (commitMessage: string) => void;
	className?: string;
	buttonStyle?: ButtonStyle;
}

const ButtonContentWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Spinner = styled(SpinnerLoader)`
	margin-right: 0.5em;
`;

const ButtonWrapper = styled.div`
	display: flex;
	justify-content: end;
	align-items: center;
	width: 100%;
	margin-top: 1em;

	> div:nth-child(1) {
		max-width: fit-content;
		flex: 1;
		&:hover {
			.file-count-notification > div {
				background: var(--color-btn-default-text-hover);
				color: var(--color-btn-default-text);
			}
		}
	}
`;

const CommitMsgUnstyled = (props: PublishActionProps, ref: MutableRefObject<HTMLInputElement>) => {
	const {
		commitMessageValue,
		commitMessagePlaceholder,
		disableCommitInput,
		disablePublishButton,
		fileCount,
		onCommitMessageChange,
		onPublishClick,
		buttonStyle,
		className,
		isLoading,
	} = props;

	const canPush = useIsSourceDataValid();

	return (
		<div className={classNames(className, {}, ["commit-action"])}>
			<Input
				disabled={disableCommitInput}
				isCode
				onChange={(e) => {
					const message = e.currentTarget.value;
					onCommitMessageChange(message);
				}}
				onFocus={(e) => {
					if (e.currentTarget.value == commitMessagePlaceholder) e.currentTarget.select();
				}}
				placeholder={t("commit-message")}
				ref={ref}
				style={{ fontSize: "1em" }}
				value={typeof commitMessageValue === "string" ? commitMessageValue : commitMessagePlaceholder}
			/>
			<ButtonWrapper>
				<Button
					buttonStyle={buttonStyle}
					disabled={disablePublishButton || !canPush}
					fullWidth
					isEmUnits
					onClick={onPublishClick}
					textSize={TextSize.M}
				>
					<ButtonContentWrapper>
						{isLoading && <Spinner height={12} width={12} />}
						{t("git.publish.to-publish")}
						{fileCount > 0 && (
							<NotificationWrapper className="file-count-notification">
								<Notification>{fileCount}</Notification>
							</NotificationWrapper>
						)}
					</ButtonContentWrapper>
				</Button>
				{!canPush && <InvalidSourceWarning />}
			</ButtonWrapper>
		</div>
	);
};

const CommitMsg = styled(forwardRef(CommitMsgUnstyled))`
	border-radius: 0px 0px 0px 4px;

	input {
		word-wrap: break-word;
	}

	.file-count-notification {
		font-size: 10px !important;

		> div {
			color: var(--color-btn-default-text-hover);
			background: var(--color-btn-default-bg-hover);
		}
	}
`;

export default CommitMsg;
