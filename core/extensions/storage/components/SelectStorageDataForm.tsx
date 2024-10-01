import Icon from "@components/Atoms/Icon";
import FormStyle from "@components/Form/FormStyle";
import Sidebar from "@components/Layouts/Sidebar";
import ActionListItem from "@components/List/ActionListItem";
import { ButtonItem } from "@components/List/Item";
import ListLayout from "@components/List/ListLayout";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SelectConfluenceStorageDataFields from "@ext/confluence/core/components/SelectConfluenceStorageDataFields";
import SelectGitStorageDataFields from "@ext/git/actions/Source/Git/components/SelectGitStorageDataFields";
import GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import t from "@ext/localization/locale/translate";
import { useEffect, useMemo, useState } from "react";
import SelectGitHubStorageDataFields from "../../git/actions/Source/GitHub/components/SelectGitHubStorageDataFields";
import SelectGitLabStorageDataFields from "../../git/actions/Source/GitLab/components/SelectGitLabStorageDataFields";
import CreateSourceData from "../logic/SourceDataProvider/components/CreateSourceData";
import SourceData from "../logic/SourceDataProvider/model/SourceData";
import SourceType from "../logic/SourceDataProvider/model/SourceType";
import getStorageNameByData from "../logic/utils/getStorageNameByData";
import StorageData from "../models/StorageData";
import SourceListItem from "./SourceListItem";
import Mode from "@ext/git/actions/Clone/model/Mode";
import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import LanguageService from "@core-ui/ContextServices/Language";

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
		controlLable: t("storage"),
		sideBarTitle: t("add-new-storage"),
		filter: (data: SourceData) =>
			data.sourceType === SourceType.git ||
			data.sourceType === SourceType.gitHub ||
			data.sourceType === SourceType.gitLab,
	};

	const { placeholderSuffix, controlLable, sideBarTitle, filter } = useMemo(() => {
		const modeConfigs = {
			import: {
				placeholderSuffix: t("source2").toLowerCase(),
				controlLable: t("source"),
				sideBarTitle: t("add-new-source"),
				filter: (data: SourceData) =>
					data.sourceType === SourceType.confluenceCloud || data.sourceType === SourceType.confluenceServer,
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
					setSelectStorageData(data);
					setStorageDatas([...sourceDatas, data]);
				}}
			/>
		),
		onClick: () => setExternalIsOpen(true),
		labelField: "",
	};

	useEffect(() => {
		if (!selectSourceData) onChange(null);
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
						<label className="control-label">{controlLable}</label>
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
