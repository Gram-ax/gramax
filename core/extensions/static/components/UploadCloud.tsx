import t from "@ext/localization/locale/translate";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import UploadButton from "@ext/static/components/UploadCloudProgress";
import CloudStateService from "@core-ui/ContextServices/CloudState";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import { Description } from "@ui-kit/Description";
import { Button } from "@ui-kit/Button";
import CloudModalBody from "@ext/static/components/CloudModalBody";
import useGetCatalogCloudUrl from "@ext/static/utils/cloudUrl";

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
				title={actionText}
				description={
					catalogVersion ? t("cloud.upload-modal.published.description") : t("cloud.upload-modal.description")
				}
				icon="cloud-upload"
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
				secondaryButton={
					<Button variant="outline" startIcon="log-out" onClick={onClickLogOut}>
						{t("cloud.upload-modal.switch-account")}
					</Button>
				}
				primaryButton={<UploadButton actionText={actionText} onUpload={onUpload} />}
			/>
		</>
	);
};

export default UploadCloud;
