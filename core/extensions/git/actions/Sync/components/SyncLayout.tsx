import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import styled from "@emotion/styled";
import PullPushCounter from "@ext/git/actions/Sync/components/PullPushCounter";
import t from "@ext/localization/locale/translate";
import { CSSProperties } from "react";

const Wrapper = styled.span`
	display: flex;
	align-items: center;
	gap: 4px;
`;

const Warning = styled.span`
	margin-left: 2px;
`;

const SyncLayout = styled(
	({
		pullCounter,
		pushCounter,
		sourceInvalid,
		syncProccess,
		onClick,
		style,
		className,
	}: {
		pullCounter: number;
		pushCounter: number;
		syncProccess: boolean;
		sourceInvalid: boolean;
		onClick?: () => void;
		style?: CSSProperties;
		className?: string;
	}) => {
		const ok = syncProccess ? t("synchronization") : `${t("sync")} ${t("catalog.name")}`;
		const err = t("storage-not-connected");

		return (
			<span className={className} style={style}>
				<StatusBarElement
					className="sync-icons"
					disable={syncProccess}
					iconClassName={"rotate-icon" + (syncProccess ? " rotate" : "")}
					iconCode="refresh-cw"
					iconStrokeWidth="1.6"
					onClick={onClick}
					tooltipText={sourceInvalid ? err : ok}
				>
					<Wrapper>
						{sourceInvalid && <Warning>!</Warning>}
						<PullPushCounter pullCounter={pullCounter} pushCounter={pushCounter} />
					</Wrapper>
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
