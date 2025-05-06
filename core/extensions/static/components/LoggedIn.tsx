import Button from "@components/Atoms/Button/Button";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import SmallFence from "@components/Labels/SmallFence";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

const SmallFenceStyled = styled(SmallFence)`
	width: fit-content;
`;

interface LoggedInComponentProps {
	clientName: string;
	onUpload?: (url: string) => void;
	onError?: () => void;
}

const getCloudUrl = (clientName: string, cloudServiceUrl: string) => {
	const [protocol, domain] = cloudServiceUrl.split("://");
	return `${protocol}://${clientName}.${domain}`;
};

const LoggedIn = ({ clientName, onUpload, onError }: LoggedInComponentProps) => {
	const [isDownloading, setIsDownloading] = useState(false);
	const catalogName = CatalogPropsService.value?.name ?? "";
	const cloudServiceUrl = PageDataContextService.value.conf.cloudServiceUrl;
	const CLOUD_URL = getCloudUrl(clientName, cloudServiceUrl);
	const url = `${CLOUD_URL}/${catalogName}`;

	const apiUrlCreator = ApiUrlCreatorService.value;

	const loading = (
		<FormStyle>
			<>
				<legend>{t("loading2")}</legend>
				<SpinnerLoader height={100} width={100} fullScreen />
			</>
		</FormStyle>
	);

	if (isDownloading) return loading;

	return (
		<FormStyle>
			<fieldset>
				<legend>{t("cloud.upload-catalog")}</legend>
				<div className="article">
					{t("cloud.catalog-link")}
					<SmallFenceStyled value={url} />
				</div>
				<div className="buttons">
					<Button
						onClick={async () => {
							setIsDownloading(true);
							const res = await FetchService.fetch(apiUrlCreator.uploadStatic());
							setIsDownloading(false);
							if (res.ok) onUpload?.(url);
							else onError?.();
						}}
					>
						{t("cloud.upload-button")}
					</Button>
				</div>
			</fieldset>
		</FormStyle>
	);
};

export default LoggedIn;
