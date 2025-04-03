import Checkbox from "@components/Atoms/Checkbox";
import DiffContent from "@components/Atoms/DiffContent";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Tooltip from "@components/Atoms/Tooltip";
import LeftNavViewContent, { ViewContent } from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import t from "@ext/localization/locale/translate";
import useHasRemoteStorage from "@ext/storage/logic/utils/useHasRemoteStorage";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageInitialized";
import { useEffect, useState } from "react";
import User from "../../../../security/components/User/User";
import { ArticleHistoryViewModel } from "../model/ArticleHistoryViewModel";

const History = styled(({ className, item }: { className?: string; item: ClientArticleProps }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = CatalogPropsService.value;
	const pageData = PageDataContextService.value;
	const { isReadOnly } = pageData.conf;

	const [isFileNew, setIsFileNew] = useState(false);
	const [showDiff, setShowDiff] = useState(true);
	const [isOpen, setIsOpen] = useState(false);
	const [data, setData] = useState<ArticleHistoryViewModel[]>(null);
	const showDiffText = t("show-diffs");

	const hasRemoteStorage = useHasRemoteStorage();
	const isStorageInitialized = useIsStorageInitialized();
	const disabled = !hasRemoteStorage || !isStorageInitialized || isFileNew;

	const loadData = async () => {
		const response = await FetchService.fetch<ArticleHistoryViewModel[]>(
			apiUrlCreator.getVersionControlFileHistoryUrl(item.ref.path),
		);
		if (!response.ok) {
			setIsOpen(false);
			return;
		}
		setData(await response.json());
	};

	const getIsFileNew = async () => {
		const res = await FetchService.fetch<GitStatus>(apiUrlCreator.getVersionControlFileStatus(item.ref.path));
		const gitStatus = await res.json();
		setIsFileNew(!gitStatus || gitStatus.status == FileStatus.new);
	};

	useEffect(() => {
		if (!hasRemoteStorage || !isStorageInitialized || isReadOnly) return;
		void getIsFileNew();
	}, [catalogProps.name, item?.logicPath, hasRemoteStorage, isStorageInitialized, isReadOnly]);

	useEffect(() => {
		const handler = async (_, caller: OnBranchUpdateCaller) => {
			if (caller !== OnBranchUpdateCaller.Publish) return;
			await getIsFileNew();
		};
		BranchUpdaterService.addListener(handler);
		return () => BranchUpdaterService.removeListener(handler);
	}, [apiUrlCreator, item?.logicPath]);

	const spinnerLoader = (
		<LogsLayout style={{ overflow: "hidden" }}>
			<SpinnerLoader fullScreen />
		</LogsLayout>
	);

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => {
				setIsOpen(true);
				loadData();
			}}
			onClose={() => {
				setShowDiff(true);
				setIsOpen(false);
				setData(null);
			}}
			disabled={disabled}
			contentWidth={data ? "L" : null}
			trigger={
				<Tooltip content={t(t("git.history.error.need-to-publish"))} disabled={!disabled}>
					<ButtonLink
						onClick={() => setIsOpen(true)} // Without this it doesn't work
						disabled={disabled}
						iconCode="history"
						text={t("git.history.button")}
					/>
				</Tooltip>
			}
		>
			<div className={className}>
				{data ? (
					<LeftNavViewContent
						elements={data.map(
							(model): ViewContent => ({
								leftSidebar: (
									<div className={className}>
										<div style={{ padding: "1rem" }}>
											<User name={model.author} date={model.date} />
											<div className="file-path">
												<DiffContent
													showDiff={showDiff}
													isCode={false}
													changes={model.filePath.diff ?? [{ value: model.filePath.path }]}
												/>
											</div>
										</div>
									</div>
								),
								content: (
									<div className={className}>
										<div className="diff-content">
											<DiffContent showDiff={showDiff} changes={model.content ?? []} />
										</div>
									</div>
								),
							}),
						)}
						sideBarBottom={
							<div className={className}>
								<div className="show-diff-checkbox">
									<Checkbox checked={showDiff} onChange={(isChecked) => setShowDiff(isChecked)}>
										<>{showDiffText}</>
									</Checkbox>
								</div>
							</div>
						}
					/>
				) : (
					spinnerLoader
				)}
			</div>
		</ModalLayout>
	);
})`
	.diff-content {
		padding: 20px;
	}

	.show-diff-checkbox {
		gap: 0.7rem;
		height: 20%;
		width: 100%;
		display: flex;
		font-size: 13px;
		max-height: 70px;
		border-radius: var(--radius-small);
		padding-left: 15px;
		padding-bottom: 10px;
		padding-top: 10px;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		background: var(--color-menu-bg);
	}

	.checkbox span {
		cursor: pointer;
		color: #777;
		font-size: 13px;
		line-height: 1.2em;
		padding-left: 3.5px;
	}

	.username {
		font-size: 15px;
	}

	.user-data .date {
		font-weight: 400;
		color: var(--color-input-active-text) !important;
	}

	.file-path {
		font-size: 13px;
		font-weight: 300;
		word-break: break-all;
	}
`;

export default History;
