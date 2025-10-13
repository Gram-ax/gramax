import Checkbox from "@components/Atoms/Checkbox";
import DiffContent from "@components/Atoms/DiffContent";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LeftNavViewContent, { ViewContent } from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";
import User from "../../../../security/components/User/User";
import { ArticleHistoryViewModel } from "../model/ArticleHistoryViewModel";

interface HistoryProps {
	item: ClientArticleProps;
	className?: string;
	onClose: () => void;
}

const History = (props: HistoryProps) => {
	const { className, item, onClose } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [showDiff, setShowDiff] = useState(true);
	const [isOpen, setIsOpen] = useState(true);
	const [data, setData] = useState<ArticleHistoryViewModel[]>(null);
	const showDiffText = t("show-diffs");

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

	const spinnerLoader = (
		<LogsLayout style={{ overflow: "hidden" }}>
			<SpinnerLoader fullScreen />
		</LogsLayout>
	);

	useEffect(() => {
		loadData();
	}, []);

	const onCloseModal = () => {
		setShowDiff(true);
		setIsOpen(false);
		setData(null);
		onClose();
	};

	return (
		<ModalLayout isOpen={isOpen} onClose={onCloseModal} contentWidth={data ? "L" : null}>
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
};

export default styled(History)`
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
