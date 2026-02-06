import { useRouter } from "@core/Api/useRouter";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { type UseApiProps, useDeferApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { useCallback } from "react";
import StorageData from "../../../../storage/models/StorageData";

export type StartCloneResponse = { alreadyExist: boolean };

export type UseCloneRepoProps = {
	storageData?: StorageData;
	skipCheck?: boolean;
	branch?: string;
	isBare?: boolean;
	redirectOnClone?: string;
	deleteIfExists?: boolean;
	skipLfsPull?: boolean;
} & Pick<UseApiProps, "onStart" | "onError">;

export type StartCloneProps = {
	data: StorageData;
};

export const useCloneRepo = ({ onError, ...props }: UseCloneRepoProps) => {
	const router = useRouter();

	const { isNext } = usePlatform();

	const redirect = useCallback(
		(data: GitStorageData) => {
			const { redirectOnClone } = props;

			if (isNext) return;
			if (!redirectOnClone && !data) return;

			const path =
				redirectOnClone ||
				RouterPathProvider.getPathname({
					filePath: [],
					sourceName: getStorageNameByData(data.source),
					group: data.group,
					repo: data.name,
					catalogName: data.name,
					itemLogicPath: [],
					repNameItemLogicPath: [],
				});

			if (path) router.pushPath(path.toString());
		},
		[router, props.redirectOnClone],
	);

	const { call } = useDeferApi<StartCloneResponse>({
		onError,
	});

	const startClone = useCallback(
		async (defer?: UseCloneRepoProps) => {
			const data = defer ? { ...props, ...defer } : props;

			if (!data || !data.storageData) return;

			return await call({
				url: (api) =>
					api.startClone(
						data.storageData.name,
						data.isBare,
						data.redirectOnClone,
						data.skipCheck,
						data.branch,
						data.deleteIfExists,
						data.skipLfsPull,
					),
				opts: {
					body: data.storageData,
					parse: "json",
				},
				onDone: ({ alreadyExist }) =>
					alreadyExist ? redirect(data.storageData as unknown as GitStorageData) : data.onStart?.(),
			});
		},
		[call, redirect, props],
	);

	return { startClone };
};
