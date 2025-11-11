import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/BlockCommentView";
import renderGroup from "@ext/markdown/elements/view/render/components/Displays/Helpers/List/Group";
import updateListData from "@ext/markdown/elements/view/render/logic/updateListData";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { ViewRenderGroup } from "@ext/properties/models";
import { Fragment, ReactNode, useCallback, useState } from "react";

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
		[data, disabled],
	);

	return (
		<BlockCommentView commentId={commentId}>
			<div data-focusable="true" className="flex w-full h-full">
				<ul className={className}>
					{data.map((group: ViewRenderGroup, idx: number) => (
						<Fragment key={`${group.group?.[0]}-${idx}`}>
							{renderGroup(group, disabled, onSubmit, isPrint)}
						</Fragment>
					))}
				</ul>
			</div>
		</BlockCommentView>
	);
};

export default styled(List)`
	border-radius: var(--radius-small);

	a {
		cursor: pointer !important;
	}

	li > div {
		gap: 0.5em;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		word-wrap: break-word;
		flex-direction: row;

		.chips {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			word-wrap: break-word;
			gap: 0.5em;
			font-size: 0.65em;

			* {
				line-height: normal !important;
			}
		}
	}
`;
