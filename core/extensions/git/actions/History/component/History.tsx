import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import Checkbox from "@components/Atoms/Checkbox";
import DiffContent from "@components/Atoms/DiffContent";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LeftNavViewContent, { ViewContent } from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import { useState } from "react";
import useLocalize from "../../../../localization/useLocalize";
import User from "../../../../security/components/User/User";
import { ArticleHistoryViewModel } from "../model/ArticleHistoryViewModel";

const History = styled(({ className, shouldRender }: { className?: string; shouldRender: boolean }) => {
	if (!shouldRender) return null;

	const apiUrlCreator = ApiUrlCreatorService.value;
	const [showDiff, setShowDiff] = useState(true);
	const [isOpen, setIsOpen] = useState(false);
	const [data, setData] = useState<ArticleHistoryViewModel[]>(null);
	const showDiffText = useLocalize("showDiffs");

	const loadData = async () => {
		const response = await FetchService.fetch<ArticleHistoryViewModel[]>(
			apiUrlCreator.getVersionControlFileHistoryUrl(),
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
			contentWidth={data ? "L" : null}
			trigger={<ListItem iconCode="history" text={useLocalize("versionHistory")} />}
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
		border-radius: 4px;
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
`;

export default History;
