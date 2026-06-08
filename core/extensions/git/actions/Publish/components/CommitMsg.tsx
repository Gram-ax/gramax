import type { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Input from "@components/Atoms/Input";
import { classNames } from "@components/libs/classNames";
// biome-ignore lint/style/noRestrictedImports: will be deleted with new sidebar UI
import styled from "@emotion/styled";
import PublishActionButton from "@ext/git/actions/Publish/components/PublishActionButton";
import t from "@ext/localization/locale/translate";
import useIsSourceDataValid from "@ext/storage/components/useIsSourceDataValid";
import InvalidSourceWarning from "@ext/storage/logic/SourceDataProvider/components/InvalidSourceWarning";
import { forwardRef, type MutableRefObject } from "react";

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
	publishButtonTooltip?: string;
	showCreateBranchButton?: boolean;
	showGitConflictsButton?: boolean;
}

const ButtonWrapper = styled.div`
	display: flex;
	justify-content: end;
	align-items: center;
	width: 100%;
	margin-top: 1em;

	> div:nth-of-type(1) {
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
		publishButtonTooltip,
		showCreateBranchButton,
		showGitConflictsButton,
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
					if (e.currentTarget.value === commitMessagePlaceholder) e.currentTarget.select();
				}}
				placeholder={t("commit-message")}
				ref={ref}
				style={{ fontSize: "1em" }}
				value={typeof commitMessageValue === "string" ? commitMessageValue : commitMessagePlaceholder}
			/>
			<ButtonWrapper>
				<PublishActionButton
					buttonStyle={buttonStyle}
					canPush={canPush}
					disablePublishButton={disablePublishButton}
					fileCount={fileCount}
					isLoading={isLoading}
					onPublishClick={onPublishClick}
					publishButtonTooltip={publishButtonTooltip}
					showCreateBranchButton={showCreateBranchButton}
					showGitConflictsButton={showGitConflictsButton}
				/>
				{!showCreateBranchButton && !canPush && <InvalidSourceWarning />}
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
