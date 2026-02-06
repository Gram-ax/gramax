import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import ViewRenderContent from "@ext/markdown/elements/view/render/components/ViewRenderContent";
import { PropertyValue, ViewRenderGroup } from "@ext/properties/models";
import { Display } from "@ext/properties/models/display";
import { useCallback, useState } from "react";

interface ViewProps {
	defs: PropertyValue[];
	orderby: string[];
	groupby: string[];
	select: string[];
	display: Display;
	disabled?: boolean;
	commentId?: string;
	isPrint?: boolean;
	updateArticle?: (articlePath: string, property: string, value: string, isDelete?: boolean) => void;
}

const View = (props: ViewProps) => {
	const { defs, orderby, groupby, select, display, updateArticle, disabled = true, commentId, isPrint } = props;
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
			commentId={commentId}
			content={content}
			defs={defs}
			disabled={disabled}
			display={display}
			groupby={groupby}
			isPrint={isPrint}
			orderby={orderby}
			select={select}
			updateArticle={updateArticle}
		/>
	);
};

export default View;
