import Tooltip from "@components/Atoms/Tooltip";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import styled from "@emotion/styled";
import { useValidateSource } from "@ext/git/actions/Source/logic/useValidateSource";
import t from "@ext/localization/locale/translate";
import CreateStorage from "@ext/storage/components/CreateStorage";
import useSourceData from "@ext/storage/components/useSourceData";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import removeSourceTokenIfInvalid from "@ext/storage/logic/utils/removeSourceTokenIfInvalid";

export type InvalidSourceWarningProps = {
	small?: boolean;
	source?: SourceData;
	modalTrigger?: boolean;
};

const Warning = styled.span<InvalidSourceWarningProps>`
	border-radius: 9999px;
	background: var(--color-danger);
	color: white;
	font-size: ${({ small }) => (small ? "10px" : "12px")};
	padding: ${({ small }) => (small ? "0px 4.5px" : "0px 6px")};
	line-height: 1.3;
	height: fit-content;
	margin-left: 6px;
	cursor: pointer;
`;

const InvalidSourceWarning = ({ small, source, modalTrigger = true }: InvalidSourceWarningProps) => {
	const data = removeSourceTokenIfInvalid(source || useSourceData());
	const sourceDatas = SourceDataService.value;
	const validateSource = useValidateSource();

	const trigger = (
		<Tooltip content={t("storage-not-connected")}>
			<Warning small={small}>!</Warning>
		</Tooltip>
	);

	if (!modalTrigger) return trigger;

	return (
		<CreateStorage
			trigger={<div>{trigger}</div>}
			onSubmit={async (data: SourceData) => {
				await validateSource(data, sourceDatas);
			}}
			data={data}
			sourceType={data?.sourceType}
		/>
	);
};

export default InvalidSourceWarning;
