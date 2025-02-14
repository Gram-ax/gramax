import ExperimentalFeatures from "@components/HomePage/ExperimentalFeatures";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

const Wrapper = styled.div`
	width: 100%;

	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: bottom;
	margin-top: 2rem;
	margin-bottom: 7px;

	height: fit-content;
`;

const Part = styled.div`
	display: flex;
	gap: 1.5rem;

	font-size: 12px !important;
	opacity: 0.7;
	color: var(--color-primary-general);

	> div:nth-child(2) {
		padding-top: 0.5px;
	}
`;

const BottomInfo = () => {
	const config = PageDataContextService.value.conf;

	const cred = `© Gramax ${new Date().getFullYear()}`;
	const ver = `${t("version")} ${config.version} ${config.isRelease ? "" : "dev"}`.trim();

	return (
		<Wrapper>
			<Part>{ver}</Part>
			<Part>
				<ExperimentalFeatures />
				<div>{cred}</div>
			</Part>
		</Wrapper>
	);
};

export default BottomInfo;
