import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Button from "@components/Atoms/Button/Button";
import Checkbox from "@components/Atoms/Checkbox";
import DiffContent from "@components/Atoms/DiffContent";
import Divider from "@components/Atoms/Divider";
import Input from "@components/Atoms/Input";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LeftNavViewContent, { ViewContent } from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import styled from "@emotion/styled";
import { useEffect, useRef, useState } from "react";
import DiffItem from "../../../../VersionControl/model/DiffItem";
import DiffResource from "../../../../VersionControl/model/DiffResource";
import useLocalize from "../../../../localization/useLocalize";
import useIsReview from "../../../../storage/logic/utils/useIsReview";
import Discard from "../../Discard/Discard";
import deleteSideBarDataItem from "../logic/deleteSideBarDataItems";
import findArticleIdx from "../logic/findArticleIdx";
import getAllFilePaths from "../logic/getAllFilePaths";
import getSideBarData from "../logic/getSideBarData";
import SideBarData from "../model/SideBarData";
import SideBarArticleActions from "./SideBarArticleActions";
import SideBarResource from "./SideBarResource";

const Publish = styled(({ changesCount, className }: { changesCount?: number; className?: string }) => {
	const [hasDiscard, setHasDiscard] = useState(false);
	const [commitMessage, setCommitMessage] = useState("");
	const [publishProcess, setPublishProcess] = useState(false);
	const [discardProcess, setDiscardProcess] = useState(false);
	const [contentEditable, setContentEditable] = useState(true);

	const [openId, setOpenId] = useState(0);
	const [isOpen, setIsOpen] = useState(false);

	const [logicPaths, setLogicPaths] = useState<string[]>(null);
	const [sideBarData, setSideBarData] = useState<SideBarData[]>(null);

	const [fileCountToShow, setFileCountToShow] = useState<number>(0);
	const [filePaths, setFilePaths] = useState<string[]>([]);

	const [checkAll, setCheckAll] = useState(true);

	const inputRef = useRef<HTMLInputElement>(null);
	const [hasFocused, setHasFocused] = useState(false);

	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const publishText = useLocalize("publish");
	const selectAllText = useLocalize("selectAll");
	const commitMessageText = useLocalize("commitMessage");

	const isReview = useIsReview();
	const publishUrl = apiUrlCreator.getStoragePublishUrl(commitMessage, !isReview);
	const diffItemsUrl = apiUrlCreator.getVersionControlDiffItemsUrl();

	const canPublish = !publishProcess && commitMessage && fileCountToShow;

	const publish = async () => {
		setContentEditable(false);
		setPublishProcess(true);
		const response = await FetchService.fetch(publishUrl, JSON.stringify(filePaths), MimeTypes.json);
		setPublishProcess(false);
		if (!response.ok) {
			setContentEditable(true);
			return;
		}
		setIsOpen(false);
	};

	const getDiffItemsData = async () => {
		const response = await FetchService.fetch<{ items: DiffItem[]; resources: DiffResource[] }>(diffItemsUrl);
		if (!response.ok) {
			setIsOpen(false);
			return;
		}

		const diffItemsData = await response.json();
		const itemDiffs = getSideBarData(diffItemsData?.items ?? [], checkAll);
		const anyFileDiffs = getSideBarData(diffItemsData?.resources ?? [], checkAll);
		const currentSideBarData: SideBarData[] = [];

		if (itemDiffs.length && anyFileDiffs.length) {
			currentSideBarData.push(...[...itemDiffs, null, ...anyFileDiffs]);
		} else {
			if (itemDiffs.length) currentSideBarData.push(...itemDiffs);
			if (anyFileDiffs.length) currentSideBarData.push(...anyFileDiffs);
		}

		const currentLogicPaths: string[] = itemDiffs.map((sideBarItem) => sideBarItem.data.logicPath);
		setLogicPaths(currentLogicPaths);
		setSideBarData(currentSideBarData);
		setOpenId(findArticleIdx(articleProps.path, currentLogicPaths));
	};

	useEffect(() => {
		if (!sideBarData) return;
		if (!hasFocused) {
			inputRef.current.focus();
			setHasFocused(true);
		}
		setFilePaths(getAllFilePaths(sideBarData));
		setFileCountToShow(getAllFilePaths(sideBarData, false).length);

		setCheckAll(
			sideBarData
				.filter((x) => x)
				.map((x) => x.data.isChecked)
				.every((x) => x),
		);
	}, [sideBarData]);

	useEffect(() => {
		if (!articleProps.path || !logicPaths) return;
		setOpenId(findArticleIdx(articleProps.path, logicPaths));
	}, [articleProps.path]);

	useEffect(() => {
		if (!sideBarData) return;
		if (!sideBarData[0] || !sideBarData[sideBarData.length - 1]) setSideBarData(sideBarData.filter((x) => x));
		if (sideBarData.filter((x) => x).length === 0 && hasDiscard) setIsOpen(false);
	}, [sideBarData?.length, hasDiscard]);

	const spinnerLoader = (
		<LogsLayout style={{ overflow: "hidden" }}>
			<SpinnerLoader fullScreen />
		</LogsLayout>
	);

	return (
		<ModalLayout
			isOpen={isOpen}
			trigger={
				<StatusBarElement tooltipText={useLocalize("publishChanges")} iconCode="cloud-arrow-up">
					{changesCount ? <span>{changesCount}</span> : null}
				</StatusBarElement>
			}
			onOpen={() => {
				setIsOpen(true);
				getDiffItemsData();
			}}
			onClose={async () => {
				if (hasDiscard) {
					refreshPage();
					await ArticleUpdaterService.update(apiUrlCreator);
				}
				setContentEditable(true);
				setPublishProcess(false);
				setHasFocused(false);
				setCommitMessage("");
				setSideBarData(null);
				setHasDiscard(false);
				setIsOpen(false);
				setCheckAll(true);
			}}
			onCmdEnter={() => {
				if (canPublish) publish();
			}}
			className={"commit-modal " + className}
			contentWidth={sideBarData ? "80%" : null}
		>
			<>
				<ModalLayout isOpen={publishProcess || discardProcess}>{spinnerLoader}</ModalLayout>
				{sideBarData === null ? (
					spinnerLoader
				) : (
					<div>
						<LeftNavViewContent
							elements={sideBarData.flatMap((x, idx) => {
								if (!x) {
									return {
										leftSidebar: (
											<div style={{ padding: "1rem" }}>
												<Divider />
											</div>
										),
										clickable: false,
									};
								}
								const item: ViewContent = {
									leftSidebar: (
										<SideBarArticleActions
											{...x.data}
											checked={x.data.isChecked}
											addedCounter={x.diff?.added}
											removedCounter={x.diff?.removed}
											onChangeCheckbox={(isChecked) => {
												const newSideBarData = [...sideBarData];
												newSideBarData[idx].data.isChecked = isChecked;
												setSideBarData(newSideBarData);
											}}
											onDiscard={(paths) => {
												const { sideBarData: editedSideBarData, hasDeleted } =
													deleteSideBarDataItem(sideBarData, paths);
												setSideBarData(editedSideBarData);
												setHasDiscard(hasDeleted);
											}}
											goToActicleOnClick={() => setIsOpen(false)}
										/>
									),
									content: (
										<div className={className}>
											<div className="diff-content">
												<DiffContent showDiff={true} changes={x.diff?.changes ?? []} />
											</div>
										</div>
									),
								};
								return x.data.resources
									? [
											item,
											...x.data.resources.map(
												(resource): ViewContent => ({
													leftSidebar: (
														<div style={{ padding: "1rem 1rem 1rem 0" }}>
															<SideBarResource title={resource.title} />
														</div>
													),
													content: (
														<div className={className}>
															<div className="diff-content">
																<DiffContent
																	showDiff={true}
																	changes={resource.diff?.changes ?? []}
																/>
															</div>
														</div>
													),
												}),
											),
									  ]
									: item;
							})}
							sideBarTop={
								<div className="select-all">
									<div className="select-all-checkbox">
										<Checkbox
											checked={checkAll}
											onClick={(isChecked) => {
												const newSideBarData = [...sideBarData];
												newSideBarData.forEach((item) => {
													if (!item) return;
													item.data.isChecked = isChecked;
												});
												setSideBarData(newSideBarData);
											}}
											onChange={(isChecked) => setCheckAll(isChecked)}
										>
											<p className="select-all-text" style={{ userSelect: "none" }}>
												{selectAllText}
											</p>
										</Checkbox>
										{fileCountToShow > 0 && (
											<div className="discard-all">
												<Discard
													paths={filePaths}
													selectedText
													onStartDiscard={() => setDiscardProcess(true)}
													onDiscard={(paths) => {
														setDiscardProcess(false);
														if (!paths.length) return;
														setSideBarData(
															sideBarData.filter((d) =>
																!d ? true : !paths.includes(d.data.filePath.path),
															),
														);
														setHasDiscard(true);
													}}
												/>
											</div>
										)}
									</div>
									<div className="divider">
										<Divider />
									</div>
								</div>
							}
							sideBarBottom={
								<div className="commit-action">
									<Input
										ref={inputRef}
										isCode
										value={commitMessage}
										onChange={(e) => {
											setCommitMessage(e.currentTarget.value);
										}}
										disable={!contentEditable}
										placeholder={commitMessageText}
									/>
									<div className="commit-button">
										<Button onClick={publish} disabled={!canPublish} fullWidth>
											{publishText}
											{fileCountToShow > 0 && ` (${fileCountToShow})`}
										</Button>
									</div>
								</div>
							}
							currentIdx={openId}
						/>
					</div>
				)}
			</>
		</ModalLayout>
	);
})`
	.diff-content {
		padding: 20px;
	}

	.commit-button {
		margin-top: 1rem;
	}

	.divider {
		padding-top: 1rem;
	}

	.commit-action,
	.select-all {
		padding: 1rem;
		background: var(--color-menu-bg);
	}

	.select-all {
		border-radius: 4px 0px 0px 0px;
	}

	.select-all-checkbox {
		display: flex;
		min-width: 100%;
		width: fit-content;
		flex-direction: row;
		justify-content: space-between;
		color: var(--color-primary-general);
	}

	.discard-all a {
		color: var(--color-primary-general);
		:hover {
			color: var(--color-primary);
		}
	}

	.commit-action {
		border-radius: 0px 0px 0px 4px;

		input {
			word-wrap: break-word;
		}
	}

	.no-changes-text {
		color: var(--color-article-text);
		text-align: center;
	}

	.select-all-text {
		color: var(--color-primary-general);
	}

	.select-all-text:hover {
		color: var(--color-primary);
	}

	.select-all-checkbox {
		a {
			font-weight: 300;
			color: var(--color-primary-general);
			text-decoration: none;
		}

		a:hover {
			color: var(--color-primary);
		}
	}
`;

export default Publish;
