import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useRouter } from "@core/Api/useRouter";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { CloneProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { useEffect, useState } from "react";

const getPercent = (progress: CloneProgress, firstReceived: number) => {
	if (!progress?.data) return null;
	if (progress?.type === "finish") return null;
	if (progress.type === "chunkedTransfer") {
		if (progress.data.transfer.type == "indexingDeltas") {
			return Math.round((progress.data.transfer.data.indexed / progress.data.transfer.data.total) * 100);
		}

		if (progress.data.transfer.type == "receivingObjects") {
			const received = progress.data.transfer.data.received;
			const total = progress.data.transfer.data.total;
			return Math.round(((received * 1.1 - firstReceived) / (total - firstReceived)) * 100);
		}
	}
	if (progress.type === "checkout") {
		return Math.round((progress.data.checkouted / progress.data.total) * 100);
	}
};

const useCloneProgress = (initIsCloning: boolean, catalogName: string, redirectOnClone: string) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();
	const [error, setError] = useState<DefaultError>(null);
	const [progress, setProgress] = useState<CloneProgress>(null);
	const [percentage, setPercentage] = useState(0);
	const [isCloning, setIsCloning] = useState(initIsCloning);

	useEffect(() => {
		if (!isCloning) return;

		let firstReceived = 0;

		/* eslint-disable */
		const intervalIdx = setInterval(async () => {
			const res = await FetchService.fetch<CloneProgress>(apiUrlCreator.getStorageCloneProgressUrl(catalogName));
			if (!res.ok) return;
			const data = await res.json();

			setProgress(data);

			if (data?.type === "chunkedTransfer" && data.data.transfer.type === "receivingObjects" && !firstReceived)
				firstReceived = data.data.transfer.data.received;

			setPercentage(getPercent(data, firstReceived));

			if (data?.type === "finish") {
				setIsCloning(false);
				clearInterval(intervalIdx);
				if (redirectOnClone) router.pushPath(redirectOnClone);
			}

			if (data?.type === "error") {
				setIsCloning(false);
				clearInterval(intervalIdx);
				setError(data.data.error);
			}

			return () => clearInterval(intervalIdx);
		}, 1000);
	}, [isCloning]);

	useEffect(() => {
		setIsCloning(initIsCloning);
	}, [initIsCloning]);

	return { progress, error, percentage, isCloning };
};

export default useCloneProgress;
