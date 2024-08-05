import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import Sidebar from "@components/Layouts/Sidebar";
import LinkTitleContextService, { useFetchArticleHeaders } from "@core-ui/ContextServices/LinkTitleTooltip";
import eventEmmiter from "@core/utils/eventEmmiter";
import styled from "@emotion/styled";
import LinkItem from "@ext/artilce/LinkCreator/models/LinkItem";
import t from "@ext/localization/locale/translate";
import { MouseEvent, useEffect, useState } from "react";
import TitleItems from "./TitileItems";

type HeadingLinkItemProps = { title: string; iconCode?: string; item?: LinkItem; className?: string };

const HeadingLinkItem = ({ title, iconCode, item, className }: HeadingLinkItemProps) => {
	const { apiUrlCreator, parentRef, onMouseEnter } = LinkTitleContextService.value;
	const [isOpen, setIsOpen] = useState(false);

	const { isLoading, headers, fetchArticleHeaders, itemClickHandler } = useFetchArticleHeaders({
		apiUrlCreator,
		linkItem: item,
	});

	const onClickHandler = (e: MouseEvent<HTMLElement>) => {
		e.stopPropagation();
		e.preventDefault();

		void fetchArticleHeaders();
		setIsOpen(true);
	};

	useEffect(() => {
		const handleHaveSidebar = () => setIsOpen(false);

		eventEmmiter.on("closeTitleTooltip", handleHaveSidebar);

		return () => {
			eventEmmiter.off("closeTitleTooltip", handleHaveSidebar);
		};
	}, []);

	const linkItemOnMouseEnter = () => onMouseEnter(item);

	return (
		<div className={className} onMouseEnter={linkItemOnMouseEnter}>
			<Sidebar
				title={title}
				leftActions={iconCode && [<Icon key={3} code={iconCode} />]}
				rightActions={[
					<Tooltip
						key={0}
						offset={[-8, 15.5]}
						placement="right-start"
						appendTo={parentRef.current}
						interactive
						arrow={false}
						visible={isOpen}
						hideOnClick={false}
						customStyle
						content={
							<TitleItems
								itemClickHandler={itemClickHandler}
								setIsOpen={setIsOpen}
								isLoadingData={isLoading}
								items={headers}
								isOpen={isOpen}
							/>
						}
					>
						<Tooltip key={1} inverseStyle delay={300} content={t("choose-header")}>
							<Button
								textSize={TextSize.S}
								onClick={onClickHandler}
								buttonStyle={ButtonStyle.transparentInverse}
								className={"modifyContent hidden_elem"}
							>
								<Icon code={"chevron-right"} />
							</Button>
						</Tooltip>
					</Tooltip>,
				]}
			/>
		</div>
	);
};

export default styled(HeadingLinkItem)`
	width: 100%;
	padding: 5px 13px;

	.modifyContent {
		opacity: 0;
	}

	.sidebar-article-element {
		overflow: hidden;
		max-width: 90%;

		:first-of-type {
			max-width: 100%;
		}
	}
`;
