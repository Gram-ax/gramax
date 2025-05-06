import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useRouter } from "@core/Api/useRouter";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { useCallback } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import StorageData from "../../../../storage/models/StorageData";

export interface CloneHandlerProps {
	storageData: StorageData;
	skipCheck?: boolean;
	recursive?: boolean;
	branch?: string;
	isBare?: boolean;
	redirectOnClone?: string;
	onStart?: VoidFunction;
	onFinish?: (path: string) => void;
	onError?: VoidFunction;
}

const useCloneHandler = () => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;

	return useCallback(
		async (props: CloneHandlerProps) => {
			const { storageData, redirectOnClone, skipCheck, recursive, isBare, branch, onStart, onError } = props;

			if (!storageData) return;

			const res = await FetchService.fetch(
				apiUrlCreator.getStorageStartCloneUrl(
					storageData.name,
					recursive,
					isBare,
					redirectOnClone,
					skipCheck,
					branch,
				),
				storageData ? JSON.stringify(storageData) : null,
				MimeTypes.json,
			);
			if (!res.ok) {
				onError();
				return null;
			}

			const data = await res.json();
			if (data?.alreadyExist) {
				router.pushPath(
					redirectOnClone ||
						RouterPathProvider.getPathname({
							filePath: [],
							sourceName: getStorageNameByData(storageData.source),
							group: (storageData as GitStorageData).group,
							repo: (storageData as GitStorageData).name,
							catalogName: storageData.name,
							itemLogicPath: [],
							repNameItemLogicPath: [],
						}).toString(),
				);
			} else {
				onStart?.();
			}
		},
		[router, apiUrlCreator],
	);
};

export default useCloneHandler;
