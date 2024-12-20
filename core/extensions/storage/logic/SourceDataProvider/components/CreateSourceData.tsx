import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ListLayout from "@components/List/ListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import LanguageService from "@core-ui/ContextServices/Language";
import useWatch from "@core-ui/hooks/useWatch";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import Mode from "@ext/git/actions/Clone/model/Mode";
import t from "@ext/localization/locale/translate";
import getSourceConfig from "@ext/storage/logic/SourceDataProvider/logic/getSourceConfig";
import getSourceProps from "@ext/storage/logic/SourceDataProvider/logic/getSourceProps";
import sourceComponents from "@ext/storage/logic/SourceDataProvider/logic/sourceComponents";
import { useMemo, useState } from "react";
import SourceListItem from "../../../components/SourceListItem";
import SourceData from "../model/SourceData";
import SourceType from "../model/SourceType";

interface CreateSourceDataProps {
	trigger?: JSX.Element;
	defaultSourceType?: SourceType;
	defaultSourceData?: Partial<SourceData>;
	onCreate?: (data: SourceData) => void;
	onClose?: () => void;
	onOpen?: () => void;
	externalIsOpen?: boolean;
	mode?: Mode;
}

const CreateSourceData = (props: CreateSourceDataProps) => {
	const {
		trigger,
		onCreate,
		defaultSourceType,
		defaultSourceData,
		onClose = () => {},
		onOpen,
		externalIsOpen,
		mode = Mode.init,
	} = props;
	const [isOpen, setIsOpen] = useState(!trigger);
	const [sourceType, setSourceType] = useState<SourceType>(defaultSourceType ?? null);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const createStorageUserData = async (data: SourceData) => {
		const url = apiUrlCreator.setSourceData();
		const res = await FetchService.fetch(url, JSON.stringify(data), MimeTypes.json);
		if (res.ok) onCreate?.(data);
		setIsOpen(false);
	};

	useWatch(() => {
		if (externalIsOpen) setIsOpen(externalIsOpen);
	}, [externalIsOpen]);

	const { placeholderSuffix, legendLabel, controlLabel, filter } = useMemo(() => {
		return getSourceConfig(mode);
	}, [LanguageService.currentUi()]);

	const SourceComponent = sourceComponents[sourceType];

	return (
		<ModalLayout
			trigger={trigger}
			isOpen={isOpen}
			closeOnCmdEnter={false}
			onOpen={() => {
				setIsOpen(true);
				onOpen?.();
			}}
			onClose={() => {
				setIsOpen(false);
				onClose();
			}}
		>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>{legendLabel}</legend>
						<fieldset>
							<div className="form-group field field-string row">
								<label className="control-label">{controlLabel}</label>
								<div className="input-lable">
									<ListLayout
										disable={!!defaultSourceType}
										disableSearch={!!defaultSourceType}
										openByDefault={!defaultSourceType}
										item={defaultSourceType ?? ""}
										placeholder={`${t("find")} ${placeholderSuffix}`}
										items={Object.values(SourceType)
											.filter(filter)
											.filter((v) => (v === SourceType.yandexDisk ? getIsDevMode() : true))
											.map((v) => ({
												element: <SourceListItem code={v.toLowerCase()} text={v} />,
												labelField: v,
											}))}
										onItemClick={(labelField) => setSourceType(labelField as SourceType)}
										onSearchClick={() => setSourceType(null)}
									/>
								</div>
							</div>
							{SourceComponent && (
								<SourceComponent
									{...getSourceProps(sourceType, defaultSourceData)}
									onSubmit={createStorageUserData}
								/>
							)}
						</fieldset>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default CreateSourceData;
