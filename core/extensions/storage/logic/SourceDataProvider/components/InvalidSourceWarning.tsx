import Tooltip from "@components/Atoms/Tooltip";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import Mode from "@ext/git/actions/Clone/model/Mode";
import { useValidateSource } from "@ext/git/actions/Source/logic/useValidateSource";
import t from "@ext/localization/locale/translate";
import useSourceData from "@ext/storage/components/useSourceData";
import CreateSourceData from "@ext/storage/logic/SourceDataProvider/components/CreateSourceData";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
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
	const pageData = PageDataContextService.value;
	const validateSource = useValidateSource();

	const trigger = (
		<Tooltip content={t("storage-not-connected")}>
			<Warning small={small}>!</Warning>
		</Tooltip>
	);

	if (!modalTrigger) return trigger;

	return (
		<CreateSourceData
			trigger={<div>{trigger}</div>}
			onCreate={(data: SourceData) => {
				validateSource(data);
				const name = getStorageNameByData(data);
				const index = pageData.sourceDatas.findIndex((s) => getStorageNameByData(s) === name);
				if (index !== -1) {
					pageData.sourceDatas[index] = data;
					PageDataContextService.value = { ...pageData };
				}
			}}
			defaultSourceData={data}
			defaultSourceType={data?.sourceType}
			mode={Mode.init}
		/>
	);
};

export default InvalidSourceWarning;
