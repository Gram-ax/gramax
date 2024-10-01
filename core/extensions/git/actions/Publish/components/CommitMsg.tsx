import Button from "@components/Atoms/Button/Button";
import Input from "@components/Atoms/Input";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { forwardRef, MutableRefObject } from "react";

interface PublishActionProps {
	commitMessageValue: string;
	commitMessagePlaceholder: string;
	disableCommitInput: boolean;
	disablePublishButton: boolean;
	fileCount: number;
	onPublishClick: () => void;
	onCommitMessageChange: (commitMessage: string) => void;
	className?: string;
}

const CommitMsgUnstyled = (props: PublishActionProps, ref: MutableRefObject<HTMLInputElement>) => {
	const {
		commitMessageValue,
		commitMessagePlaceholder,
		disableCommitInput,
		disablePublishButton,
		fileCount,
		onCommitMessageChange,
		onPublishClick,
		className,
	} = props;
	return (
		<div className={classNames(className, {}, ["commit-action"])}>
			<Input
				ref={ref}
				isCode
				value={commitMessageValue}
				onFocus={(e) => {
					if (e.currentTarget.value == commitMessagePlaceholder) e.currentTarget.select();
				}}
				onChange={(e) => {
					const message = e.currentTarget.value;
					if (message === commitMessagePlaceholder) return;
					onCommitMessageChange(message);
				}}
				disabled={disableCommitInput}
				placeholder={t("commit-message")}
			/>
			<div className="commit-button">
				<Button onClick={onPublishClick} disabled={disablePublishButton} fullWidth>
					{t("publish")}
					{fileCount > 0 && ` (${fileCount})`}
				</Button>
			</div>
		</div>
	);
};

const CommitMsg = styled(forwardRef(CommitMsgUnstyled))`
	border-radius: 0px 0px 0px 4px;

	input {
		word-wrap: break-word;
	}

	.commit-button {
		margin-top: 1rem;
	}
`;

export default CommitMsg;
