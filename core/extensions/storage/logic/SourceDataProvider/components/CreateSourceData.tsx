import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ListLayout from "@components/List/ListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useEffect, useState } from "react";
import ErrorHandler from "../../../../errorHandlers/client/components/ErrorHandler";
import CreateGitHubSourceData from "../../../../git/actions/Source/GitHub/components/CreateGitHubSourceData";
import CreateGitLabSourceData from "../../../../git/actions/Source/GitLab/components/CreateGitLabSourceData";
import useLocalize from "../../../../localization/useLocalize";
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
}

const CreateSourceData = (props: CreateSourceDataProps) => {
	const { trigger, onCreate, defaultSourceType, defaultSourceData, onClose = () => {}, externalIsOpen } = props;
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
										openByDefault={!defaultSourceType}
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
										sourceType: sourceType as any,
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
