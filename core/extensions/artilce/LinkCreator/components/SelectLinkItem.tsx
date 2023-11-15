import Icon from "@components/Atoms/Icon";
import Breadcrumb from "@components/Breadcrumbs/Breadcrumb";
import Sidebar from "@components/Layouts/Sidebar";
import ListLayout, { ListLayoutElement } from "@components/List/ListLayout";
import LoadingListItem from "@components/List/LoadingListItem";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import styled from "@emotion/styled";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { useEffect, useRef, useState } from "react";
import { ItemType } from "@core/FileStructue/Item/Item";
import LinkItem from "../models/LinkItem";

const SelectLinkItem = styled(
	({
		value,
		onChange,
		itemLinks,
		className,
	}: {
		value: string;
		itemLinks: LinkItem[];
		onChange: (value: string, href: string) => void;
		className?: string;
	}) => {
		const listRef = useRef<ListLayoutElement>();
		const [externalLink, setExternalLink] = useState<string>(null);

		const isExternalLink = !!parseStorageUrl(value)?.domain;
		const item = itemLinks ? itemLinks.find((l) => l.relativePath == value) : null;
		const icon = !item ? "globe" : item.type == ItemType.article ? "file" : "folder";
		const [button, setButton] = useState<boolean>(!!item || isExternalLink);

		const onSearchChange = (value: string) => {
			if (!parseStorageUrl(value).domain) setExternalLink(null);
			else setExternalLink(value);
		};

		useEffect(() => {
			if (button || !listRef?.current) return;
			listRef.current.searchRef.inputRef.focus();
		}, [button]);

		return button ? (
			<div style={{ width: "100%" }} onClick={() => setButton(false)}>
				<Button icon={icon} text={item ? item.title : value} />
			</div>
		) : (
			<div style={{ padding: "0px 5.5px", width: "100%" }}>
				<ListLayout
					ref={listRef}
					isCode={false}
					openByDefault
					placeholder={"Cсылка"}
					itemsClassName={className}
					onSearchChange={onSearchChange}
					onItemClick={(_, __, idx) => {
						if (externalLink) onChange(externalLink, externalLink);
						else onChange(itemLinks[idx].relativePath, itemLinks[idx].logicPath);
					}}
					items={
						externalLink
							? [
									{
										element: (
											<div style={{ width: "100%", padding: "5px 10px" }}>
												<Sidebar
													title={externalLink}
													leftActions={[<Icon faFw key={0} code={"globe"} />]}
												/>
											</div>
										),
										labelField: externalLink,
									},
							  ]
							: itemLinks
							? itemLinks.map((linkItem) => ({
									element: (
										<div style={{ width: "100%", padding: "5px 10px" }}>
											<Sidebar
												title={linkItem.title}
												leftActions={[
													<Icon
														faFw
														key={0}
														code={linkItem.type == ItemType.article ? "file" : "folder"}
													/>,
												]}
											/>
											<Breadcrumb
												middleDots
												content={linkItem.breadcrumb.map((text) => ({ text }))}
											/>
										</div>
									),
									labelField: linkItem.title,
							  }))
							: [LoadingListItem]
					}
				/>
			</div>
		);
	},
)`
	left: 0;
	margin-top: 4px;
	min-width: 238px;
	margin-left: -9px;
	border-radius: var(--radius-big-block);
	background: var(--color-tooltip-background);

	.item,
	.breadcrumb {
		color: var(--color-article-bg);

		.link {
			line-height: 1.5em;
		}
	}

	.item:hover {
		background: var(--color-edit-menu-button-active-bg);
	}
`;

export default SelectLinkItem;
