import t from "@ext/localization/locale/translate";
import { UploadStatus } from "@ext/static/logic/CloudUploadStatus";
import { Button } from "@ui-kit/Button";
import useUploadProgress from "@ext/static/components/useUploadProgress";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useState } from "react";
import { Bar, Wrapper } from "@components/Atoms/ProgressBar";
import Icon from "@components/Atoms/Icon";

const resolveLabelText = (status: UploadStatus["status"]) => {
	if (!status) return t("cloud.upload-modal.status.building");
	if (status === "uploading") return t("cloud.upload-modal.status.publishing");
};

const UploadCloudProgress = ({ progress }: Pick<UploadStatus, "progress">) => {
	const percent = progress ? Math.round((progress.current / progress.total) * 100) : 0;
	return (
		<Wrapper>
			<Bar data-qa="loader" progress={percent} />
		</Wrapper>
	);
};

const UploadButton = ({ actionText, onUpload }: { actionText: string; onUpload: () => void; className?: string }) => {
	const [startUploading, setStartUploading] = useState(false);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const { status, error, progress } = useUploadProgress(startUploading);

	const onClick = async () => {
		setStartUploading(true);
		const res = await FetchService.fetch(apiUrlCreator.uploadStatic());
		setStartUploading(false);
		if (res.ok) onUpload?.();
	};

	if (startUploading)
		return (
			<Button variant="outline" disabled className="relative">
				<Icon isLoading />
				{resolveLabelText(status)}
				<UploadCloudProgress progress={progress} />
			</Button>
		);

	return (
		<Button variant="primary" onClick={onClick} startIcon="cloud-upload">
			{actionText}
		</Button>
	);
};

export default UploadButton;
