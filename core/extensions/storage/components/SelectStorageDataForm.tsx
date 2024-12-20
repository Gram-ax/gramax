import Icon from "@components/Atoms/Icon";
import FormStyle from "@components/Form/FormStyle";
import Sidebar from "@components/Layouts/Sidebar";
import ActionListItem from "@components/List/ActionListItem";
import { ButtonItem } from "@components/List/Item";
import ListLayout from "@components/List/ListLayout";
import LanguageService from "@core-ui/ContextServices/Language";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useWatch from "@core-ui/hooks/useWatch";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import SelectConfluenceStorageDataFields from "@ext/confluence/core/components/SelectConfluenceStorageDataFields";
import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import Mode from "@ext/git/actions/Clone/model/Mode";
import SelectGitStorageDataFields from "@ext/git/actions/Source/Git/components/SelectGitStorageDataFields";
import GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import t from "@ext/localization/locale/translate";
import NotionSourceData from "@ext/notion/model/NotionSourceData";
import NotionStorageData from "@ext/notion/model/NotionStorageData";
import importSourceTypes from "@ext/storage/logic/SourceDataProvider/logic/importSourceType";
import { useMemo, useState } from "react";
import SelectGitHubStorageDataFields from "../../git/actions/Source/GitHub/components/SelectGitHubStorageDataFields";
import SelectGitLabStorageDataFields from "../../git/actions/Source/GitLab/components/SelectGitLabStorageDataFields";
import CreateSourceData from "../logic/SourceDataProvider/components/CreateSourceData";
import SourceData from "../logic/SourceDataProvider/model/SourceData";
import SourceType from "../logic/SourceDataProvider/model/SourceType";
import getStorageNameByData from "../logic/utils/getStorageNameByData";
import StorageData from "../models/StorageData";
import SourceListItem from "./SourceListItem";

interface SelectStorageDataFormProps {
	title: string;
	children?: JSX.Element;
	mode?: Mode;
	onChange?: (data: StorageData) => void;
}

const SelectStorageDataForm = (props: SelectStorageDataFormProps) => {
	const { title, children, mode, onChange } = props;
	const pageProps = PageDataContextService.value;
	const [childrenCloseHandler, setChildrenCloseHandler] = useState<(value: boolean) => void>(() => () => {});
	const sharedConfig = {
		placeholderSuffix: t("storage2"),
		controlLabel: t("storage"),
		sideBarTitle: t("add-new-storage"),
		filter: (data: SourceData) => [SourceType.git, SourceType.gitHub, SourceType.gitLab].includes(data.sourceType),
	};

	const { placeholderSuffix, controlLabel, sideBarTitle, filter } = useMemo(() => {
		const modeConfigs = {
			import: {
				placeholderSuffix: t("source2").toLowerCase(),
				controlLabel: t("source"),
				sideBarTitle: t("add-new-source"),
				filter: (data: SourceData) => importSourceTypes.includes(data.sourceType),
			},
			clone: {
				...sharedConfig,
			},
			init: {
				...sharedConfig,
			},
		};

		return modeConfigs[mode];
	}, [LanguageService.currentUi()]);
	const filteredSourceDatas = pageProps.sourceDatas.filter(filter);
	const [sourceDatas, setStorageDatas] = useState<SourceData[]>(filteredSourceDatas);
	const [selectSourceData, setSelectStorageData] = useState<SourceData>(null);

	const [externalIsOpen, setExternalIsOpen] = useState(false);
	const addNewStorageListItem: ButtonItem = {
		element: (
			<CreateSourceData
				mode={mode}
				externalIsOpen={externalIsOpen}
				trigger={
					<div style={{ width: "100%" }}>
						<ActionListItem>
							<div style={{ width: "100%", padding: "6px 11px" }}>
								<Sidebar
									title={sideBarTitle + "..."}
									leftActions={[<Icon code="plus" viewBox="3 3 18 18" key={0} />]}
								/>
							</div>
						</ActionListItem>
					</div>
				}
				onOpen={() => childrenCloseHandler(false)}
				onCreate={(data) => {
					const newSourceDatas = [...sourceDatas, data];
					setSelectStorageData(data);
					setStorageDatas(newSourceDatas);
					PageDataContextService.value = { ...pageProps, sourceDatas: newSourceDatas };
				}}
			/>
		),
		onClick: () => setExternalIsOpen(true),
		labelField: "",
	};

	useWatch(() => {
		if (!selectSourceData) onChange(null);
		if (selectSourceData?.sourceType === SourceType.notion)
			onChange({
				name: transliterate((selectSourceData as NotionSourceData).workspaceName, {
					kebab: true,
					maxLength: 50,
				}),
				source: selectSourceData,
			} as NotionStorageData);
		else if (selectSourceData?.sourceType === SourceType.yandexDisk) {
			onChange({ name: `YandexDisk`, source: selectSourceData });
		}
	}, [selectSourceData]);

	return (
		<FormStyle>
			<>
				<legend>
					<Icon code="cloud-download" />
					<span>{title}</span>
				</legend>
				<fieldset>
					<div className="form-group field field-string row">
						<label className="control-label">{controlLabel}</label>
						<div className="input-lable">
							<ListLayout
								placeholder={`${t("find")} ${placeholderSuffix}`}
								item={
									selectSourceData
										? {
												element: (
													<SourceListItem
														code={selectSourceData.sourceType}
														text={getStorageNameByData(selectSourceData)}
													/>
												),
												labelField: getStorageNameByData(selectSourceData),
										  }
										: ""
								}
								buttons={[addNewStorageListItem]}
								provideCloseHandler={setChildrenCloseHandler}
								items={sourceDatas.map((d) => {
									const disable = mode !== Mode.clone && d.sourceType === SourceType.git;
									return {
										isTitle: disable,
										disable: disable,
										labelField: getStorageNameByData(d),
										element: <SourceListItem code={d.sourceType} text={getStorageNameByData(d)} />,
										tooltipDisabledContent: disable && t("git.source.error.cannot-bind-to-storage"),
									};
								})}
								onItemClick={(labelField, _, idx) => {
									if (labelField) setSelectStorageData(sourceDatas[idx]);
								}}
								openByDefault={true}
							/>
						</div>
					</div>
					{selectSourceData?.sourceType === SourceType.git && (
						<SelectGitStorageDataFields
							source={selectSourceData as GitSourceData}
							onChange={onChange}
							mode={mode}
						/>
					)}
					{selectSourceData?.sourceType === SourceType.gitLab && (
						<SelectGitLabStorageDataFields
							source={selectSourceData as GitlabSourceData}
							onChange={onChange}
							mode={mode}
						/>
					)}
					{selectSourceData?.sourceType === SourceType.gitHub && (
						<SelectGitHubStorageDataFields
							source={selectSourceData as GitHubSourceData}
							onChange={onChange}
							mode={mode}
						/>
					)}
					{(selectSourceData?.sourceType === SourceType.confluenceCloud ||
						selectSourceData?.sourceType === SourceType.confluenceServer) && (
						<SelectConfluenceStorageDataFields
							source={selectSourceData as ConfluenceSourceData}
							onChange={onChange}
						/>
					)}
					{children}
				</fieldset>
			</>
		</FormStyle>
	);
};

export default SelectStorageDataForm;
