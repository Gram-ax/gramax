import CloudStateService from "@core-ui/ContextServices/CloudState";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import CloudModalBody from "@ext/static/components/CloudModalBody";
import UploadButton from "@ext/static/components/UploadCloudProgress";
import useGetCatalogCloudUrl from "@ext/static/utils/cloudUrl";
import { Button } from "@ui-kit/Button";
import { Description } from "@ui-kit/Description";
import { FormFooter, FormHeader } from "@ui-kit/Form";

interface UploadCloudComponentProps {
	onUpload?: () => void;
}

const UploadCloud = ({ onUpload }: UploadCloudComponentProps) => {
	const { cloudApi, checkClientName, catalogVersion } = CloudStateService.value;
	const url = useGetCatalogCloudUrl();

	const onClickLogOut = async () => {
		await cloudApi.signOut();
		checkClientName();
	};

	const actionText = catalogVersion ? t("cloud.upload-modal.published.title") : t("cloud.upload-modal.title");

	return (
		<>
			<FormHeader
				description={
					catalogVersion ? t("cloud.upload-modal.published.description") : t("cloud.upload-modal.description")
				}
				icon="cloud-upload"
				title={actionText}
			/>
			<CloudModalBody>
				<p
					dangerouslySetInnerHTML={{
						__html: catalogVersion ? t("cloud.upload-modal.published.info") : t("cloud.upload-modal.info"),
					}}
				/>
				<CodeBlock value={url} />
				<Description>{t("cloud.upload-modal.revoke")}</Description>
			</CloudModalBody>
			<FormFooter
				primaryButton={<UploadButton actionText={actionText} onUpload={onUpload} />}
				secondaryButton={
					<Button onClick={onClickLogOut} startIcon="log-out" variant="outline">
						{t("cloud.upload-modal.switch-account")}
					</Button>
				}
			/>
		</>
	);
};

export default UploadCloud;
