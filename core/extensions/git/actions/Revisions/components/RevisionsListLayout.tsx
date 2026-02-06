import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Tooltip from "@components/Atoms/Tooltip";
import { ItemContent, ListItem } from "@components/List/Item";
import ItemsByUikit from "@components/List/ItemsByUikit";
import RequestValueNotFound from "@components/List/RequestValueNotFound";
import { useOutsideClick } from "@core-ui/hooks/useOutsideClick";
import scrollUtils from "@core-ui/utils/scrollUtils";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import type GitVersionData from "@ext/git/core/model/GitVersionData";
import t from "@ext/localization/locale/translate";
import User from "@ext/security/components/User/User";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

const RevisionWrapper = styled.div<{ isCurrent: boolean }>`
	cursor: ${({ isCurrent }) => (isCurrent ? "default" : "pointer")};
	width: 100%;
	color: var(--color-merge-request-text);
	font-size: 12px;

	.date-container {
		display: flex;
		gap: 0.25rem;
		width: 100%;
		justify-content: space-between;
		line-height: 1.5;
		height: 1rem;
	}

	.username {
		line-height: 1;
		height: 1rem;
	}

	.user-data {
		width: 100%;
	}

	.oid {
		font-size: 0.85em;
	}
`;

const ItemsWrapper = styled.div<{ hasScroll: boolean; isLoading: boolean; shouldLoadMoreAtScrollEnd: boolean }>`
	width: 300px;

	${({ isLoading }) =>
		isLoading &&
		css`
			.item {
				padding: 0 !important;
			}
		`}

	${({ hasScroll }) =>
		hasScroll &&
		css`
			> div {
				overflow-y: auto;
			}
		`}

	${({ shouldLoadMoreAtScrollEnd }) =>
		shouldLoadMoreAtScrollEnd &&
		css`
			.item:last-child {
				padding: 0.5rem !important;
			}
		`}
`;

const SpinnerLoaderStyled = styled(SpinnerLoader)`
	.item {
		padding: 0.25rem !important;
	}
`;

const getShortOid = (oid: string) => oid.slice(0, 7);

const getItems = (
	revisions: GitVersionData[],
	currentRevision: string,
	shouldLoadMoreAtScrollEnd: boolean,
): ItemContent[] => {
	if (!revisions) return null;
	if (!revisions.length) return [{ element: <RequestValueNotFound />, labelField: "", disable: true }];

	const loadingListItem: ItemContent = {
		element: <SpinnerLoaderStyled fullScreen height={48} width={48} />,
		labelField: "",
		disable: true,
	};

	const items = revisions.map(
		(revision): ItemContent => ({
			element: (
				<RevisionWrapper isCurrent={revision.oid === currentRevision}>
					<User
						date={revision.timestamp}
						dateAdd={<span className="oid">{getShortOid(revision.oid)}</span>}
						mail={revision.author.email}
						name={revision.author.name}
						tooltipDelay={500}
					/>
				</RevisionWrapper>
			),
			labelField: revision.oid,
		}),
	);
	if (shouldLoadMoreAtScrollEnd) items.push(loadingListItem);
	return items;
};

const FormattedBranchWrapper = styled.div<{ isPlaceholder: boolean; fixWidth?: number }>`
	cursor: pointer;
	user-select: none;

	${({ isPlaceholder }) =>
		isPlaceholder &&
		css`
			opacity: 0.8;
		`}

	${({ fixWidth }) =>
		fixWidth &&
		css`
			> span {
				display: inline-block;
				min-width: ${fixWidth}px;
				max-width: ${fixWidth}px;
			}
		`}
`;

interface RevisionsListLayoutProps {
	revisions: GitVersionData[];
	currentRevision?: string;
	shouldLoadMoreAtScrollEnd: boolean;
	requestMore?: (lastRevision: string) => void | Promise<void>;
	onClick?: (revision: string) => void;
}

const RevisionsListLayout = (props: RevisionsListLayoutProps) => {
	const placeholder = t("git.revisions.choose-placeholder");

	const { revisions, currentRevision, shouldLoadMoreAtScrollEnd, onClick, requestMore } = props;

	const isPlaceholder = !currentRevision || currentRevision === placeholder;

	const revisionsRef = useRef<HTMLDivElement>(null);
	const currentRevisionRef = useRef<HTMLDivElement>(null);

	const [currentHasScroll, setCurrentHasScroll] = useState(false);

	const [isOpen, setIsOpen] = useState(false);

	const onItemClick = useCallback(
		(value: string | ListItem) => {
			const revision = (value as ListItem).labelField;
			onClick?.(revision);
			setIsOpen(false);
		},
		[onClick],
	);

	useLayoutEffect(() => {
		if (!revisionsRef.current?.firstChild || !isOpen) return;
		setCurrentHasScroll(scrollUtils.hasScroll(revisionsRef.current.firstChild as HTMLElement, 5));
	}, [revisions?.length, isOpen]);

	useOutsideClick([revisionsRef.current, currentRevisionRef.current], () => setIsOpen(false));

	const items = useMemo(
		() => getItems(revisions, currentRevision, shouldLoadMoreAtScrollEnd),
		[revisions, currentRevision, shouldLoadMoreAtScrollEnd],
	);

	const isLoading = !Array.isArray(items);

	return (
		<div>
			<Tooltip
				arrow={false}
				content={
					<ItemsWrapper
						hasScroll={currentHasScroll}
						isLoading={isLoading}
						ref={revisionsRef}
						shouldLoadMoreAtScrollEnd={shouldLoadMoreAtScrollEnd}
					>
						<ItemsByUikit
							blurInInput={() => {}}
							endReached={() => {
								if (shouldLoadMoreAtScrollEnd) requestMore?.(revisions[revisions.length - 1].oid);
							}}
							filteredWidth={100}
							isLoadingData={isLoading}
							isOpen
							items={items}
							maxItems={7}
							onItemClick={onItemClick}
							setIsOpen={() => {}}
							useVirtuoso
							value={isPlaceholder ? "" : getShortOid(currentRevision)}
						/>
					</ItemsWrapper>
				}
				customStyle
				distance={0}
				interactive
				place="bottom"
				trigger="click"
				visible={isOpen}
			>
				<FormattedBranchWrapper
					isPlaceholder={isPlaceholder}
					onClick={() => setIsOpen((v) => !v)}
					ref={currentRevisionRef}
				>
					<FormattedBranch
						changeColorOnHover
						name={isPlaceholder ? placeholder : getShortOid(currentRevision)}
					/>
				</FormattedBranchWrapper>
			</Tooltip>
		</div>
	);
};

export default RevisionsListLayout;
