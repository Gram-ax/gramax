import FetchService from "@core-ui/ApiServices/FetchService";
import ViewRenderContent from "@ext/markdown/elements/view/render/components/ViewRenderContent";
import { PropertyValue, ViewRenderGroup } from "@ext/properties/models";
import { Display } from "@ext/properties/models/displays";
import { useCallback, useState } from "react";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";

interface ViewProps {
	defs: PropertyValue[];
	orderby: string[];
	groupby: string[];
	select: string[];
	display: Display;
	disabled?: boolean;
	updateArticle?: (articlePath: string, property: string, value: string, isDelete?: boolean) => void;
}

const View = (props: ViewProps) => {
	const { defs, orderby, groupby, select, display, updateArticle, disabled = true } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [content, setContent] = useState<ViewRenderGroup[]>(null);

	const getRenderData = useCallback(
		async (
			defs: PropertyValue[],
			orderby: string[] = [],
			groupby: string[] = [],
			select: string[] = [],
			display: Display,
		) => {
			if (!apiUrlCreator) {
				setContent([]);
				return;
			}

			const res = await FetchService.fetch(
				apiUrlCreator.getViewRenderData(),
				JSON.stringify({ defs, orderby, groupby, select, display }),
			);

			if (!res.ok) return;
			setContent(await res.json());
		},
		[apiUrlCreator],
	);

	useWatch(() => {
		getRenderData(defs, orderby, groupby, select, display);
	}, [defs, orderby, groupby, select, display]);

	if (!content) return null;
	return (
		<ViewRenderContent
			defs={defs}
			groupby={groupby}
			orderby={orderby}
			select={select}
			content={content}
			display={display}
			disabled={disabled}
			updateArticle={updateArticle}
		/>
	);
};

export default View;
