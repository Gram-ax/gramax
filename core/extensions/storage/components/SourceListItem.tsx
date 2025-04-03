import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import useRemoveSource from "@ext/storage/components/useRemoveSource";
import InvalidSourceWarning from "@ext/storage/logic/SourceDataProvider/components/InvalidSourceWarning";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { forwardRef, useCallback } from "react";

export interface SourceListItemProps<S extends SourceData | "public" = SourceData | "public"> {
	source: S;
	name?: S extends SourceData ? string : undefined;
	onDelete?: (sourceName: string) => void;
	deletable?: boolean;
}

const Wrapper = styled.div`
	padding: 6px 12px;
	width: 100%;
	max-width: 100%;
	display: flex;
	align-items: center;
	position: relative;

	:hover > i {
		display: block;
	}
`;

const StyledIcon = styled(Icon)`
	margin-left: auto;
	display: none;
	cursor: pointer;
`;

const WarningWrapper = styled.div`
	display: flex;
	margin-right: 6px;
`;

const Name = styled.span`
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const SourceListItem = forwardRef<HTMLDivElement, SourceListItemProps>((props, ref) => {
	const { source, name, onDelete, deletable } = props;
	const sourceName = name || (typeof source === "string" ? source : getStorageNameByData(source));
	const { removeSource, getSourceUsage, isLoading } = useRemoveSource({ sourceName });

	const onClickHandler = useCallback(
		async (ev: React.MouseEvent<HTMLElement>) => {
			ev.stopPropagation();
			ev.preventDefault();
			const usage = await getSourceUsage();

			const message = usage?.length
				? t("git.source.remove-alert") +
				  " " +
				  t("git.source.remove-alert-usage") +
				  usage.map((u) => ` - ${u}`).join("\n")
				: t("git.source.remove-alert");

			if (await confirm(message)) {
				await removeSource();
				onDelete?.(sourceName);
			}
		},
		[removeSource, onDelete],
	);

	if (source === "public") {
		return (
			<Wrapper ref={ref}>
				<Icon code="link-2" />
				<Name>{t("git.clone.public-clone")}</Name>
			</Wrapper>
		);
	}

	return (
		<Wrapper ref={ref}>
			{source?.sourceType && <Icon code={source.sourceType.toLowerCase()} />}
			<Name>{sourceName}</Name>
			{source?.isInvalid && (
				<WarningWrapper>
					<InvalidSourceWarning small modalTrigger={false} source={source} />
				</WarningWrapper>
			)}

			{isLoading && <SpinnerLoader width={12} height={12} />}

			{deletable && sourceName && (
				<Tooltip content={t("delete")}>
					<StyledIcon onClick={onClickHandler} code="trash" />
				</Tooltip>
			)}
		</Wrapper>
	);
});

export default SourceListItem;
