import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import styled from "@emotion/styled";
import { CSSProperties, useState } from "react";
import useLocalize from "../../../localization/useLocalize";
import useIsReview from "../../../storage/logic/utils/useIsReview";

const Sync = styled(({ style, className }: { style?: CSSProperties; className?: string }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [rotateIcon, setRotateIcon] = useState(false);
	const isReview = useIsReview();
	const syncUrl = apiUrlCreator.getStoragePullUrl(!isReview);

	return (
		<span
			className={className}
			style={style}
			onClick={async () => {
				setRotateIcon(true);
				const response = await FetchService.fetch(syncUrl);
				if (!response.ok) {
					setRotateIcon(false);
					return;
				}
				setRotateIcon(false);
				refreshPage();
				await ArticleUpdaterService.update(apiUrlCreator);
			}}
		>
			<StatusBarElement
				className={"rotate-icon" + (rotateIcon ? " rotate" : "")}
				tooltipText={rotateIcon ? useLocalize("synchronization") : useLocalize("syncCatalog")}
				iconCode="arrows-rotate"
			/>
		</span>
	);
})`
	@keyframes spinner {
		to {
			transform: rotate(360deg);
		}
	}

	.rotate-icon {
		height: 100%;
	}

	.rotate-icon.rotate {
		i {
			animation: spinner 1.5s linear infinite;
		}
	}
`;

export default Sync;
