import useWatch from "@core-ui/hooks/useWatch";
import { cn } from "@core-ui/utils/cn";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import renderGroup from "@ext/markdown/elements/view/render/components/Displays/Helpers/List/Group";
import updateListData from "@ext/markdown/elements/view/render/logic/updateListData";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import type { ViewRenderGroup } from "@ext/properties/models";
import { Fragment, type ReactNode, useCallback, useState } from "react";

interface ListProps {
	content: ViewRenderGroup[];
	groupby: string[];
	className?: string;
	disabled?: boolean;
	commentId?: string;
	updateArticle?: (articlePath: string, property: string, value: string, isDelete?: boolean) => void;
	isPrint?: boolean;
}

const List = ({ content, groupby, className, disabled, updateArticle, commentId, isPrint }: ListProps): ReactNode => {
	const catalogProperties = PropertyServiceProvider.value?.properties;
	if (!content.length) return null;
	const [data, setData] = useState<ViewRenderGroup[]>(content);

	useWatch(() => {
		setData(content);
	}, [content]);

	const onSubmit = useCallback(
		(articlePath: string, groups: string[], propertyName: string, value: string, isDelete?: boolean) => {
			const newData = updateListData(
				data,
				articlePath,
				groups,
				groupby,
				catalogProperties,
				propertyName,
				value,
				isDelete,
			);
			setData(newData);
			updateArticle?.(articlePath, propertyName, value, isDelete);
		},
		[data, catalogProperties, groupby, updateArticle],
	);

	return (
		<BlockCommentView commentId={commentId}>
			<div className="flex w-full h-full" data-focusable="true">
				<ul className={cn("rounded-md", className)}>
					{data.map((group: ViewRenderGroup) => (
						<Fragment key={`${group.group?.[0]}-list-item`}>
							{renderGroup(group, disabled, onSubmit, isPrint)}
						</Fragment>
					))}
				</ul>
			</div>
		</BlockCommentView>
	);
};

export default List;
