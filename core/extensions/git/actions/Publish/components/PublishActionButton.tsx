import LegacyButton, { TextSize } from "@components/Atoms/Button/Button";
import type { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Notification from "@components/Atoms/Notification";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
// biome-ignore lint/style/noRestrictedImports: will be deleted with new sidebar UI
import styled from "@emotion/styled";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

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

const ButtonContentWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Spinner = styled(SpinnerLoader)`
	margin-right: 0.5em;
`;

const CreateBranchTooltipContent = styled.div`
	text-align: center;
`;

interface PublishActionButtonProps {
	showCreateBranchButton?: boolean;
	showGitConflictsButton?: boolean;
	publishButtonTooltip?: string;
	disablePublishButton: boolean;
	canPush: boolean;
	fileCount: number;
	isLoading?: boolean;
	buttonStyle?: ButtonStyle;
	onPublishClick: () => Promise<void> | void;
}

const PublishActionButton = (props: PublishActionButtonProps) => {
	const {
		showCreateBranchButton,
		showGitConflictsButton,
		publishButtonTooltip,
		disablePublishButton,
		canPush,
		fileCount,
		isLoading,
		buttonStyle,
		onPublishClick,
	} = props;

	const apiUrlCreator = ApiUrlCreatorService.value;

	if (showCreateBranchButton) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<div>
						<Button
							onClick={() => NavigationTabsService.setBottom(LeftNavigationTab.CreateBranch)}
							size="sm"
							startIcon={"plus"}
						>
							{t("add-new-branch")}
						</Button>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<CreateBranchTooltipContent>
						<div>{t("git.publish.error.direct-publish-forbidden")}</div>
						<div>{t("git.publish.error.create-branch-and-merge")}</div>
					</CreateBranchTooltipContent>
				</TooltipContent>
			</Tooltip>
		);
	}

	if (showGitConflictsButton) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<div>
						<Button
							onClick={async () => {
								await SyncService.sync(apiUrlCreator, true);
							}}
							size="sm"
						>
							{t("git.publish.error.resolve-conflicts")}
						</Button>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<CreateBranchTooltipContent>
						<div>{t("git.publish.error.has-conflicts-description")}</div>
					</CreateBranchTooltipContent>
				</TooltipContent>
			</Tooltip>
		);
	}

	const publishButton = (
		<LegacyButton
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
		</LegacyButton>
	);

	if (publishButtonTooltip) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<div>{publishButton}</div>
				</TooltipTrigger>
				<TooltipContent>{publishButtonTooltip}</TooltipContent>
			</Tooltip>
		);
	}

	return publishButton;
};

export default PublishActionButton;
