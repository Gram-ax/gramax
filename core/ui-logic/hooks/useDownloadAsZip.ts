import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useCallback, useState } from "react";

export type UseDownloadAsZipProps = {
	onStart?: () => void;
	onFinally?: () => void;
};

export const useDownloadAsZip = ({ onStart, onFinally }: UseDownloadAsZipProps = {}) => {
	const catalogName = useCatalogPropsStore((state) => state.data.name);
	const [isDownloading, setIsDownloading] = useState(false);

	const download = useCallback(async () => {
		setIsDownloading(true);
		onStart?.();
		try {
			await window.debug.zip(catalogName);
		} finally {
			setIsDownloading(false);
			onFinally?.();
		}
	}, [catalogName, onFinally, onStart]);

	return {
		download,
		isDownloading,
	};
};
