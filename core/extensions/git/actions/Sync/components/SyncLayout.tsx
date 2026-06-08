import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import styled from "@emotion/styled";
import PullPushCounter from "@ext/git/actions/Sync/components/PullPushCounter";
import t from "@ext/localization/locale/translate";
import type { CSSProperties } from "react";

interface SyncLayoutProps {
	pullCounter: number;
	pushCounter: number;
	sourceInvalid: boolean;
	syncProccess: boolean;
	style?: CSSProperties;
	className?: string;
	disabled?: boolean;
	onClick?: () => void;
}

const Wrapper = styled.span`
	display: flex;
	align-items: center;
	gap: 4px;
`;

const Warning = styled.span`
	margin-left: 2px;
`;

const SyncLayout = (props: SyncLayoutProps) => {
	const { pullCounter, pushCounter, sourceInvalid, syncProccess, onClick, style, className, disabled } = props;

	const ok = syncProccess ? t("synchronization") : `${t("sync")} ${t("catalog.name")}`;
	const err = t("storage-not-connected");

	return (
		<span className={className} style={style}>
			<StatusBarElement
				className="sync-icons"
				disable={disabled}
				iconClassName={`rotate-icon${syncProccess ? " rotate" : ""}`}
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
};
export default styled(SyncLayout)`
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
