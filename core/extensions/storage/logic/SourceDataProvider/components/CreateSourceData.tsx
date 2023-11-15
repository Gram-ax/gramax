import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ListLayout from "@components/List/ListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useState } from "react";
import { refreshPage } from "../../../../../ui-logic/ContextServices/RefreshPageContext";
import ErrorHandler from "../../../../errorHandlers/client/components/ErrorHandler";
import CreateGitHubSourceData from "../../../../git/actions/Storage/GitHub/components/CreateGitHubSourceData";
import CreateGitLabSourceData from "../../../../git/actions/Storage/GitLab/components/CreateGitLabSourceData";
import useLocalize from "../../../../localization/useLocalize";
import SourceListItem from "../../../components/SourceListItem";
import SourceData from "../model/SourceData";
import SourceType from "../model/SourceType";

const CreateSourceData = ({
	trigger,
	onCreate,
	defaultSourceType,
	defaultSourceData,
	onClose = () => {},
}: {
	trigger?: JSX.Element;
	defaultSourceType?: SourceType;
	defaultSourceData?: { [key: string]: string };
	onCreate?: (data: SourceData) => void;
	onClose?: () => void;
}) => {
	const [isOpen, setIsOpen] = useState(trigger ? false : true);
	const [sourceType, setSourceType] = useState<SourceType>(defaultSourceType ?? null);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const createStorageUserData = async (data: SourceData) => {
		const url = apiUrlCreator.setSourceData();
		const res = await FetchService.fetch(url, JSON.stringify(data), MimeTypes.json);
		if (res.ok) onCreate?.(data);
		refreshPage();
		setIsOpen(false);
	};

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
							<legend>{useLocalize("addNewStorage")}</legend>
							<div className="form-group field field-string row">
								<label className="control-label">{useLocalize("storage")}</label>
								<div className="input-lable">
									<ListLayout
										disable={!!defaultSourceType}
										disableSearch={!!defaultSourceType}
										openByDefault={defaultSourceType ? false : true}
										item={defaultSourceType ?? ""}
										placeholder={`${useLocalize("find")} ${useLocalize("storage2")}`}
										items={Object.values(SourceType)
											.filter((v) => v !== SourceType.enterprise)
											.map((v) => ({
												element: <SourceListItem code={v.toLowerCase()} text={v} />,
												labelField: v,
											}))}
										onItemClick={(labelField) => setSourceType(labelField as SourceType)}
										onSearchClick={() => setSourceType(null)}
									/>
								</div>
							</div>

							{sourceType == SourceType.gitLab && (
								<CreateGitLabSourceData
									props={{
										sourceType: sourceType,
										domain: "",
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
						</>
					</FormStyle>
				</ErrorHandler>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default CreateSourceData;
