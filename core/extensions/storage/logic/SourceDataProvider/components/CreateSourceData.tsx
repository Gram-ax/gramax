import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ListLayout from "@components/List/ListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CreateGitSourceData from "@ext/git/actions/Source/Git/components/CreateGitSourceData";
import t from "@ext/localization/locale/translate";
import { useEffect, useMemo, useState } from "react";
import CreateGitHubSourceData from "../../../../git/actions/Source/GitHub/components/CreateGitHubSourceData";
import CreateGitLabSourceData from "../../../../git/actions/Source/GitLab/components/CreateGitLabSourceData";
import SourceListItem from "../../../components/SourceListItem";
import SourceData from "../model/SourceData";
import SourceType from "../model/SourceType";
import Mode from "@ext/git/actions/Clone/model/Mode";
import CreateConfluenceCloudSourceData from "@ext/confluence/core/cloud/components/CreateConfluenceCloudSourceData";
import CreateConfluenceServerSourceData from "@ext/confluence/core/server/components/CreateConfluenceServerSourceData";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import LanguageService from "@core-ui/ContextServices/Language";

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

	useEffect(() => {
		if (externalIsOpen) setIsOpen(externalIsOpen);
	}, [externalIsOpen]);

	const sharedConfig = {
		placeholderSuffix: t("storage2"),
		legendLabel: t("add-new-storage"),
		controlLabel: t("storage"),
	};

	const { placeholderSuffix, legendLabel, controlLabel, filter } = useMemo(() => {
		const modeConfigs = {
			import: {
				placeholderSuffix: t("source2").toLowerCase(),
				legendLabel: t("add-new-source"),
				controlLabel: t("source"),
				filter: (v) =>
					v === SourceType.confluenceCloud ||
					(getExecutingEnvironment() === "tauri" && v === SourceType.confluenceServer),
			},
			clone: {
				...sharedConfig,
				filter: (v) => v !== SourceType.confluenceCloud && v !== SourceType.confluenceServer,
			},
			init: {
				...sharedConfig,
				filter: (v) =>
					v !== SourceType.confluenceCloud && v !== SourceType.git && v !== SourceType.confluenceServer,
			},
		};

		return modeConfigs[mode];
	}, [LanguageService.currentUi()]);

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
								{sourceType == SourceType.confluenceCloud && (
									<CreateConfluenceCloudSourceData onSubmit={createStorageUserData} />
								)}
								{sourceType == SourceType.confluenceServer && (
									<CreateConfluenceServerSourceData
										props={{
											sourceType: sourceType as any,
											domain: null,
											token: null,
											userName: "empty",
											userEmail: "empty",
											...defaultSourceData,
										}}
										onSubmit={createStorageUserData}
										readOnlyProps={defaultSourceData}
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
