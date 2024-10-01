import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { CloneProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { useEffect, useState } from "react";

const getValue = (progress: CloneProgress) => {
	if (!progress?.data) return;
	if (progress?.type === "finish") return 100;
	if (progress.type === "chunkedTransfer") {
		if (progress.data.transfer.type == "indexingDeltas") {
			return Math.round((progress.data.transfer.data.indexed / progress.data.transfer.data.total) * 100);
		}
		if (progress.data.transfer.type == "receivingObjects") {
			return Math.round((progress.data.transfer.data.received / progress.data.transfer.data.total) * 100);
		}
	}
};

const useCloneProgress = (initIsCloning: boolean, catalogName: string) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isWait, setWait] = useState(false);
	const [error, setError] = useState<DefaultError>(null);
	const [progress, setProgress] = useState<number>(null);
	const [isCloning, setIsCloning] = useState(initIsCloning);

	useEffect(() => {
		if (!isCloning) return;
		/* eslint-disable */
		const intervalIdx = setInterval(async () => {
			const res = await FetchService.fetch<CloneProgress>(apiUrlCreator.getStorageCloneProgressUrl(catalogName));
			if (!res.ok) return;
			const data = await res.json();
			setProgress(getValue(data));
			if (data?.type === "finish") {
				setIsCloning(false);
				clearInterval(intervalIdx);
				refreshPage();
			}
			if (data?.type === "error") {
				setIsCloning(false);
				clearInterval(intervalIdx);
				setError(data.data.error);
			}
			if (!data || data.type !== "wait") setWait(false);
			if (data?.type === "wait") setWait(true);
			return () => clearInterval(intervalIdx);
		}, 1000);
	}, [isCloning]);

	useEffect(() => {
		setIsCloning(initIsCloning);
	}, [initIsCloning]);

	return { progress, error, isCloning, isWait };
};

export default useCloneProgress;
