import styled from "@emotion/styled";
import type { BaseLink } from "@ext/navigation/NavigationLinks";
import { Fragment, type ReactElement, type ReactNode } from "react";
import Link from "../Atoms/Link";

const HIDER_ELEMENT = "...";

export interface BreadcrumbContentItem<TValue = string> {
	value: TValue;
	link?: BaseLink;
	onClick?: (e: React.MouseEvent) => void;
}

interface BreadcrumbProps<TValue = string> {
	content: BreadcrumbContentItem<TValue>[];
	renderItem?: (args: { item: TValue }) => ReactNode;
	renderHidden?: (args: { items: TValue[]; hiderElement: ReactNode }) => ReactNode;
	title?: string;
	middleDots?: boolean;
	className?: string;
}

const Breadcrumb = <TValue,>(props: BreadcrumbProps<TValue>): ReactElement => {
	const { title, content, renderItem, renderHidden, middleDots = true, className } = props;
	const hiddenItems = content.length > 2 ? content.slice(1, -1) : [];

	return (
		<div className={`${className} breadcrumb`}>
			{title && (
				<div className="title">
					<span>{title}</span>
				</div>
			)}
			{content.map((c, i) => {
				const isFirst = i === 0;
				const correctLength = content.length > 2;
				const isNotLast = content.length !== i + 1;
				const isMiddleDots = middleDots && correctLength ? i !== 0 && isNotLast : false;
				const text = (
					<span className="text">{renderItem ? renderItem({ item: c.value }) : String(c.value)}</span>
				);
				return (
					<Fragment key={i!}>
						{!isMiddleDots && (
							<>
								<div className="link" key={`${i!}link`} onClick={c.onClick}>
									{c.link ? <Link href={c.link}>{text}</Link> : text}
								</div>
								{isNotLast && content.length > 1 && (
									<span className="divider" key={`${i!}divider`}>
										{"/"}
									</span>
								)}
							</>
						)}
						{isFirst && correctLength && middleDots && (
							<>
								<span className="dots" key={`${i!}dots`}>
									{renderHidden
										? renderHidden({
												items: hiddenItems.map((x) => x.value),
												hiderElement: HIDER_ELEMENT,
											})
										: HIDER_ELEMENT}
								</span>
								<span className="divider" key={`${i!}divider-2`}>
									{"/"}
								</span>
							</>
						)}
					</Fragment>
				);
			})}
		</div>
	);
};

export default styled(Breadcrumb)`
	display: flex;
	font-size: 12px;
	font-weight: 400;
	align-items: center;
	flex-direction: row;
	justify-content: flex-start;
	color: var(--color-primary-general);

	.title {
		font-weight: 700;
		line-height: 1.4;
	}

	a {
		max-width: 100%;
		display: flex;
		align-items: baseline;
		color: var(--color-primary-general) !important;
		text-decoration: none !important;
	}

	a:hover {
		color: var(--color-primary) !important;
	}

	.link {
		gap: 0.26rem;
		display: flex;
		line-height: 1.4;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;

		.text {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}

	.divider {
		padding: 0 0.26rem;
	}

	.dots {
		word-break: normal;
	}
`;
