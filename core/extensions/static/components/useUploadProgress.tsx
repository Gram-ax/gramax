import useWatch from "@core-ui/hooks/useWatch";
import { useState } from "react";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { UploadStatus } from "@ext/static/logic/CloudUploadStatus";

const useUploadProgress = (startUploading: boolean, setError?) => {
	const [data, setData] = useState<UploadStatus>({ status: null });
	const [isUploading, setIsUploading] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;

	useWatch(() => {
		if (startUploading) setIsUploading(true);
	}, [startUploading]);

	useWatch(() => {
		if (!isUploading) return;

		const intervalIdx = setInterval(async () => {
			const res = await FetchService.fetch<UploadStatus>(apiUrlCreator.getUploadStatus());
			if (!res.ok) return;

			const data = await res.json();
			data && setData(data);

			if (data?.status === "error") {
				setIsUploading(false);
				clearInterval(intervalIdx);
				setError(data.error);
			}

			return () => clearInterval(intervalIdx);
		}, 500);
	}, [isUploading]);

	return data;
};

export default useUploadProgress;
