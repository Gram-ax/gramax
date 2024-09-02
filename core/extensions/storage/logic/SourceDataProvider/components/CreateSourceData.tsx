import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ListLayout from "@components/List/ListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CreateConfluenceSourceData from "@ext/confluence/actions/Source/components/CreateConfluenceSourceData";
import CreateGitSourceData from "@ext/git/actions/Source/Git/components/CreateGitSourceData";
import t from "@ext/localization/locale/translate";
import { useEffect, useMemo, useState } from "react";
import ErrorHandler from "../../../../errorHandlers/client/components/ErrorHandler";
import CreateGitHubSourceData from "../../../../git/actions/Source/GitHub/components/CreateGitHubSourceData";
import CreateGitLabSourceData from "../../../../git/actions/Source/GitLab/components/CreateGitLabSourceData";
import SourceListItem from "../../../components/SourceListItem";
import SourceData from "../model/SourceData";
import SourceType from "../model/SourceType";

interface CreateSourceDataProps {
	trigger?: JSX.Element;
	defaultSourceType?: SourceType;
	defaultSourceData?: Partial<SourceData>;
	onCreate?: (data: SourceData) => void;
	onClose?: () => void;
	externalIsOpen?: boolean;
	forClone?: boolean;
}

const CreateSourceData = (props: CreateSourceDataProps) => {
	const {
		trigger,
		onCreate,
		defaultSourceType,
		defaultSourceData,
		onClose = () => {},
		externalIsOpen,
		forClone,
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

	useEffect(() => {
		if (externalIsOpen) setIsOpen(externalIsOpen);
	}, [externalIsOpen]);

	const localizedSource2 = t("source2").toLowerCase();
	const localizedAddNewSource = t("add-new-source");
	const localizedSource = t("source");
	const localizedStorage2 = t("storage2");
	const localizedAddNewStorage = t("add-new-storage");
	const localizedStorage = t("storage");
	const localizedFind = t("find");

	const config = useMemo(
		() => ({
			import: {
				placeholderSuffix: localizedSource2,
				legendLabel: localizedAddNewSource,
				controlLabel: localizedSource,
				filter: (v) => v === SourceType.confluence,
			},
			clone: {
				placeholderSuffix: localizedStorage2,
				legendLabel: localizedAddNewStorage,
				controlLabel: localizedStorage,
				filter: (v) => v !== SourceType.confluence && (forClone === undefined ? v !== SourceType.git : true),
			},
		}),
		[],
	);

	const mode = forClone ?? true ? config.clone : config.import;

	return (
		<ModalLayout
			trigger={trigger}
			isOpen={isOpen}
			closeOnCmdEnter={false}
			onOpen={() => setIsOpen(true)}
			onClose={() => {
				setIsOpen(false);
				onClose();
			}}
		>
			<ModalLayoutLight>
				<ErrorHandler>
					<FormStyle>
						<>
							<legend>{mode.legendLabel}</legend>
							<fieldset>
								<div className="form-group field field-string row">
									<label className="control-label">{mode.controlLabel}</label>
									<div className="input-lable">
										<ListLayout
											disable={!!defaultSourceType}
											disableSearch={!!defaultSourceType}
											openByDefault={!defaultSourceType}
											item={defaultSourceType ?? ""}
											placeholder={`${localizedFind} ${mode.placeholderSuffix}`}
											items={Object.values(SourceType)
												.filter(mode.filter)
												.map((v) => ({
													element: <SourceListItem code={v.toLowerCase()} text={v} />,
													labelField: v,
												}))}
											onItemClick={(labelField) => setSourceType(labelField as SourceType)}
											onSearchClick={() => setSourceType(null)}
										/>
									</div>
								</div>
								{sourceType == SourceType.git && (
									<CreateGitSourceData
										props={{
											sourceType: sourceType as any,
											domain: "",
											protocol: "",
											token: "",
											userName: null,
											userEmail: null,
											...defaultSourceData,
										}}
										onSubmit={createStorageUserData}
										readOnlyProps={defaultSourceData}
									/>
								)}
								{sourceType == SourceType.gitLab && (
									<CreateGitLabSourceData
										props={{
											sourceType: sourceType as any,
											domain: "",
											protocol: "",
											token: "",
											userName: null,
											userEmail: null,
											...defaultSourceData,
										}}
										onSubmit={createStorageUserData}
										readOnlyProps={defaultSourceData}
									/>
								)}
								{sourceType == SourceType.gitHub && (
									<CreateGitHubSourceData onSubmit={createStorageUserData} />
								)}
								{sourceType == SourceType.confluence && (
									<CreateConfluenceSourceData onSubmit={createStorageUserData} />
								)}
							</fieldset>
						</>
					</FormStyle>
				</ErrorHandler>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default CreateSourceData;
