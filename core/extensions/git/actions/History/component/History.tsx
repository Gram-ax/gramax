import Checkbox from "@components/Atoms/Checkbox";
import DiffContent from "@components/Atoms/DiffContent";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LeftNavViewContent, { type ViewContent } from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { LoadMoreTrigger } from "@ui-kit/LoadMoreTrigger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import User from "../../../../security/components/User/User";
import type { ArticleHistoryViewModel, OffsetDataLoader } from "../model/ArticleHistoryViewModel";

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
	const [hasMore, setHasMore] = useState(true);
	const offsetRef = useRef(0);
	const showDiffText = t("show-diffs");

	const loadData = useCallback(async () => {
		const response = await FetchService.fetch<OffsetDataLoader<ArticleHistoryViewModel>>(
			apiUrlCreator.getVersionControlFileHistoryUrl(item.ref.path, offsetRef.current),
		);
		if (!response.ok) {
			setIsOpen(false);
			setHasMore(false);
			return;
		}
		const data = await response.json();

		offsetRef.current = data.nextOffset;

		setHasMore(data.hasMore);
		setData((prev) => [...(prev ?? []), ...(data?.items?.filter(Boolean) ?? [])]);
	}, [item.ref.path, apiUrlCreator.getVersionControlFileHistoryUrl]);

	const spinnerLoader = useMemo(
		() => (
			<LogsLayout style={{ overflow: "hidden" }}>
				<SpinnerLoader fullScreen />
			</LogsLayout>
		),
		[],
	);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const onCloseModal = useCallback(() => {
		setShowDiff(true);
		setIsOpen(false);
		setData(null);
		onClose();
	}, [onClose]);

	return (
		<ModalLayout contentWidth={data ? "L" : null} isOpen={isOpen} onClose={onCloseModal}>
			<div className={className}>
				{data ? (
					<LeftNavViewContent
						elements={data.map(
							(model): ViewContent => ({
								leftSidebar: (
									<div className={className}>
										<div style={{ padding: "1rem" }}>
											<User date={model.date} name={model.author} />
											<div className="file-path">
												<DiffContent
													changes={model.filePath.diff ?? [{ value: model.filePath.path }]}
													isCode={false}
													showDiff={showDiff}
												/>
											</div>
										</div>
									</div>
								),
								content: (
									<div className={className}>
										<div className="diff-content">
											<DiffContent changes={model.content ?? []} showDiff={showDiff} />
										</div>
									</div>
								),
							}),
						)}
						loadMoreTrigger={
							<LoadMoreTrigger hasMore={hasMore} loadingText={t("loading")} onLoad={loadData} />
						}
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
