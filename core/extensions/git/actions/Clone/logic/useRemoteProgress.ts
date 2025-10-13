import { useApi } from "@core-ui/hooks/useApi";
import useInterval from "@core-ui/hooks/useInterval";
import useWatch from "@core-ui/hooks/useWatch";
import { useRouter } from "@core/Api/useRouter";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { RemoteProgress, type RemoteProgressPercentage } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { useCallback, useEffect, useState } from "react";

const getPercent = (progress: RemoteProgress, firstReceived: number) => {
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

const useRemoteProgress = (
	catalogName: string,
	redirectOnClone: string,
	cloneCancelDisabled: boolean,
	setIsCancel: (isCancel: boolean) => void,
	onDone?: () => void,
) => {
	const router = useRouter();
	const [error, setError] = useState<DefaultError>(null);
	const [isCloning, setIsCloning] = useState<boolean>(false);
	const [firstReceived, setFirstReceived] = useState(0);

	const {
		call: updateProgress,
		data: progress,
		reset,
	} = useApi<RemoteProgress, RemoteProgressPercentage>({
		url: (api) => api.getCloneProgress(catalogName),
		map: (data) => {
			return data
				? {
						...data,
						percentage: getPercent(data, firstReceived),
				  }
				: null;
		},
	});

	const { start: startUpdating, stop: stopUpdating } = useInterval(updateProgress, 1000);

	useEffect(() => {
		if (isCloning) startUpdating();
		else stopUpdating();
		return () => stopUpdating();
	}, [isCloning, startUpdating, stopUpdating]);

	useWatch(() => {
		const data = progress;

		if (data?.type === "chunkedTransfer" && data.data.transfer.type === "receivingObjects" && !firstReceived)
			setFirstReceived(data.data.transfer.data.received);

		if (data?.type === "finish" && isCloning) {
			setIsCloning(false);
			if (cloneCancelDisabled && data.data.isCancelled) setIsCancel(true);
			if (redirectOnClone && !data.data.isCancelled) router.pushPath(redirectOnClone);
			else refreshPage();
			onDone?.();
		}

		if (data?.type === "error" && isCloning) {
			setIsCloning(false);
			setError(data.data.error);
		}
	}, [isCloning, firstReceived, progress, stopUpdating]);

	const start = useCallback(() => {
		reset();
		setIsCloning(true);
		setFirstReceived(0);
		setError(null);
		startUpdating();
	}, [startUpdating, reset]);

	return { progress, error, isCloning, start };
};

export default useRemoteProgress;
