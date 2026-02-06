import FetchService from "@core-ui/ApiServices/FetchService";
import type Url from "@core-ui/ApiServices/Types/Url";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import { useEffect, useState } from "react";

const useUrlObjectImage = (src: Url, deps: Array<any> = []) => {
	const [data, setData] = useState<string>();

	useEffect(() => {
		if (!src) return;

		const loadImage = async () => {
			const res = await FetchService.fetch(src);
			if (!res?.body) return setData(null);
			const blob = new Blob([res.body as any], { type: resolveFileKind(res.body as any) });
			setData(URL.createObjectURL(blob));
		};
		void loadImage();
		return () => URL.revokeObjectURL(data);
	}, [typeof src == "string" ? src : src?.toString(), ...deps]);

	return data;
};

export default useUrlObjectImage;
