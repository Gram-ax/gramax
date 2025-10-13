import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { useCallback, useState } from "react";

export type UseDownloadAsZipProps = {
	onStart?: () => void;
	onFinally?: () => void;
};

export const useDownloadAsZip = ({ onStart, onFinally }: UseDownloadAsZipProps = {}) => {
	const catalogProps = CatalogPropsService.value;
	const [isDownloading, setIsDownloading] = useState(false);

	const download = useCallback(async () => {
		setIsDownloading(true);
		onStart?.();
		try {
			await window.debug.zip(catalogProps.name);
		} finally {
			setIsDownloading(false);
			onFinally?.();
		}
	}, [catalogProps, onFinally, onStart]);

	return {
		download,
		isDownloading,
	};
};
