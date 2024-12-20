import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

const BottomInfo = styled(({ className }: { className?: string }) => {
	const config = PageDataContextService.value.conf;
	return (
		<div className={className}>
			<div className="bottom-info">
				<div>{`${t("version")} ${config.version}${config.isRelease ? "" : " dev"}`}</div>
				<div>{"© Gramax " + new Date().getFullYear()}</div>
			</div>
		</div>
	);
})`
	width: 100%;

	.bottom-info {
		display: flex;
		justify-content: space-between;
		flex-direction: row;
		margin-top: 2rem;
		margin-bottom: 7px;
		font-size: 14px;

		> div {
			font-size: 12px;
			opacity: 0.7;
			color: var(--color-primary-general);
		}
	}
`;

export default BottomInfo;
