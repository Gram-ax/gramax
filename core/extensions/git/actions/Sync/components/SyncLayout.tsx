import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import styled from "@emotion/styled";
import PullPushCounter from "@ext/git/actions/Sync/components/PullPushCounter";
import t from "@ext/localization/locale/translate";
import { CSSProperties } from "react";

const SyncLayout = styled(
	({
		pullCounter,
		pushCounter,
		syncProccess,
		onClick,
		style,
		className,
	}: {
		pullCounter: number;
		pushCounter: number;
		syncProccess: boolean;
		onClick?: () => void;
		style?: CSSProperties;
		className?: string;
	}) => {
		return (
			<span className={className} style={style}>
				<StatusBarElement
					reverse
					onClick={onClick}
					className="sync-icons"
					iconCode="refresh-cw"
					iconStrokeWidth="1.6"
					iconClassName={"rotate-icon" + (syncProccess ? " rotate" : "")}
					tooltipText={syncProccess ? t("synchronization") : `${t("sync")} ${t("catalog.name")}`}
					disable={syncProccess}
				>
					<PullPushCounter pullCounter={pullCounter} pushCounter={pushCounter} />
				</StatusBarElement>
			</span>
		);
	},
)`
	@keyframes spinner {
		to {
			transform: rotate(360deg);
		}
	}

	.sync-icons {
		height: 100%;
	}

	.rotate-icon.rotate {
		i {
			animation: spinner 1.5s linear infinite;
		}
	}
`;

export default SyncLayout;
