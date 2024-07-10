import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import FetchService from "@core-ui/ApiServices/FetchService";
import type Url from "@core-ui/ApiServices/Types/Url";
import { useEffect, useState } from "react";

const useUrlObjectImage = (src: Url) => {
	const [data, setData] = useState<string>();

	useEffect(() => {
		const loadImage = async () => {
			const res = await FetchService.fetch(src);
			if (!res?.body) return setData(null);
			const blob = new Blob([res.body as any], { type: resolveImageKind(res.body as any) });
			setData(URL.createObjectURL(blob));
		};
		void loadImage();
		return () => URL.revokeObjectURL(data);
	}, [typeof src == "string" ? src : src.toString()]);

	return data;
};

export default useUrlObjectImage;
