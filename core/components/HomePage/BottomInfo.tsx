import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import useLocalize from "../../extensions/localization/useLocalize";

const BottomInfo = styled(({ className }: { className?: string }) => {
	return (
		<div className={className}>
			<div className="bottom-info" data-qa="home-page-bottom-info">
				<div>{`${useLocalize("version")} ${PageDataContextService.value.conf.version}`}</div>
				<div data-qa="home-page-bottom-info-copyright">{"© Gramax " + new Date().getFullYear()}</div>
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
		margin-bottom: 1rem;
		font-size: 14px;

		> div {
			color: var(--color-primary-general);
		}
	}
`;

export default BottomInfo;
