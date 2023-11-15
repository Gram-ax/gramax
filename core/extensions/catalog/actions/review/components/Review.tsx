import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Form from "@components/Form/Form";
import FormStyle from "@components/Form/FormStyle";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import Path from "@core/FileProvider/Path/Path";
import { JSONSchema7 } from "json-schema";
import { useEffect, useRef, useState } from "react";
import FormVariableHandler from "../../../../../logic/Form/FormVariableHandler";
import parseStorageUrl from "../../../../../logic/utils/parseStorageUrl";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import CatalogPropsService from "../../../../../ui-logic/ContextServices/CatalogProps";
import useLocalize from "../../../../localization/useLocalize";
import Fence from "../../../../markdown/elements/fence/render/component/Fence";
import getAccessTokenDocs from "../../../../storage/logic/utils/getAccessTokenDocs";
import getPartSourceDataByStorageName from "../../../../storage/logic/utils/getPartSourceDataByStorageName";
import ReviewProps from "../model/ReviewProps.schema";
import Schema from "../model/ReviewProps.schema.json";

const Review = () => {
	const [reviewProps, setReviewProps] = useState<ReviewProps>({ email: "", name: "", haveAccess: false });
	const [schema, setSchema] = useState<JSONSchema7>(Schema as JSONSchema7);
	const [ticket, setTicket] = useState("");
	const [apiProcess, setApiProcess] = useState(false);
	const generateLinkText = useLocalize("generateLink");

	const formVariableHandler = useRef<FormVariableHandler>(null);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const articleProps = ArticlePropsService.value;
	const getStorageUrlUrl = apiUrlCreator.getStorageUrl();

	const sourceName = CatalogPropsService.value.sourceName;
	const { sourceType } = getPartSourceDataByStorageName(sourceName);

	const getRelativeArticlePath = () => {
		const articlePath = new Path(articleProps.path);
		return articlePath.rootDirectory.subDirectory(articlePath).removeExtraSymbols.value;
	};

	const getStorageUrl = async () => {
		const res = await FetchService.fetch(getStorageUrlUrl);
		if (!res.ok) return null;
		const url = await res.text();
		const parsedUrl = parseStorageUrl(url);
		formVariableHandler.current = new FormVariableHandler(schema, {
			ACCESS_TOKEN_DOCS: getAccessTokenDocs(sourceType),
			STORAGE_NAME: `${parsedUrl.group}/${parsedUrl.name}`,
			STORAGE_URL: url,
		});
	};

	useEffect(() => {
		getStorageUrl();
	}, []);

	const getReviewLink = async (userName: string, userEmail: string): Promise<string> => {
		const reviewTicketUrl = apiUrlCreator.getReviewLinkUrl(getRelativeArticlePath());
		setApiProcess(true);
		const response = await FetchService.fetch(
			reviewTicketUrl,
			JSON.stringify({ userName, userEmail }),
			MimeTypes.json,
		);
		setApiProcess(false);
		if (!response.ok) return "";
		return await response.text();
	};

	const getShareLink = async (): Promise<string> => {
		const shareTicketUrl = apiUrlCreator.getShareLinkUrl(getRelativeArticlePath());
		setApiProcess(true);
		const response = await FetchService.fetch(shareTicketUrl);
		setApiProcess(false);
		if (!response.ok) return "";
		return await response.text();
	};

	return (
		<ModalLayout
			trigger={
				<a>
					<Icon code="share-from-square" faFw={true} />
					<span>{useLocalize("submitToReview")}</span>
				</a>
			}
			onClose={() => {
				setReviewProps({ email: "", name: "", haveAccess: false });
				setTicket("");
			}}
		>
			<>
				<ModalLayout isOpen={apiProcess}>
					<LogsLayout style={{ overflow: "hidden" }}>
						<SpinnerLoader fullScreen />
					</LogsLayout>
				</ModalLayout>
				<ModalLayoutLight>
					<Form<ReviewProps>
						schema={schema}
						props={reviewProps}
						fieldDirection="row"
						onSubmit={async (p) => {
							setReviewProps(p);
							setTicket(p.haveAccess ? await getShareLink() : await getReviewLink(p.name, p.email));
						}}
						onChange={(p) => {
							if (p.haveAccess) {
								p.email = "";
								p.name = "";
								(schema.properties.email as JSONSchema7).readOnly = true;
								(schema.properties.name as JSONSchema7).readOnly = true;
							} else {
								(schema.properties.email as JSONSchema7).readOnly = false;
								(schema.properties.name as JSONSchema7).readOnly = false;
							}
							setReviewProps({ ...p });
						}}
						onMount={(_, schema) => {
							formVariableHandler.current.replaceVars();
							setSchema({ ...schema });
						}}
						onUnmount={(_, schema) => {
							formVariableHandler.current.reverseReplace();
							setSchema({ ...schema });
						}}
						disableSubmit={apiProcess || !!ticket}
						submitText={generateLinkText}
					/>
					{ticket && (
						<FormStyle>
							<Fence value={ticket} />
						</FormStyle>
					)}
				</ModalLayoutLight>
			</>
		</ModalLayout>
	);
};

export default Review;
