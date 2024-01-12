import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import styled from "@emotion/styled";
import PullPushCounter from "@ext/git/actions/Sync/PullPushCounter";
import { CSSProperties } from "react";
import useLocalize from "../../../localization/useLocalize";

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
					onClick={onClick}
					className="sync-icons"
					iconClassName={"rotate-icon" + (syncProccess ? " rotate" : "")}
					tooltipText={syncProccess ? useLocalize("synchronization") : useLocalize("syncCatalog")}
					iconCode="arrows-rotate"
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
