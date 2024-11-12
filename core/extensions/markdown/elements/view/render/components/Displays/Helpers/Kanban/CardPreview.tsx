import styled from "@emotion/styled";
import { CSSProperties, DragEvent, forwardRef, MouseEvent, useMemo } from "react";
import { Property as PropertyType, PropertyTypes } from "@ext/properties/models";
import Property from "@ext/properties/components/Property";
import t from "@ext/localization/locale/translate";
import { classNames } from "@components/libs/classNames";

interface CardProps {
	otherProps: PropertyType[];
	title?: string;
	className?: string;
	style?: CSSProperties;
	dragging?: boolean;
	onDragStart?: (e: DragEvent) => void;
	onMouseEnter?: (e: MouseEvent) => void;
	onDoubleClick?: (e: MouseEvent) => void;
	onMouseDown?: (e: MouseEvent) => void;
}

const CardPreview = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
	const {
		title = t("article.no-name"),
		otherProps,
		className,
		style,
		dragging,
		onDragStart,
		onMouseEnter,
		onDoubleClick,
		onMouseDown,
	} = props;

	const properties = useMemo(
		() =>
			otherProps.map((property) => {
				const isFlag = property.type === PropertyTypes.flag;
				return (
					<Property
						key={property.name}
						type={property.type}
						icon={property.icon}
						propertyStyle={property.style}
						name={property.name}
						value={!isFlag ? property.value : property.name}
					/>
				);
			}),
		[otherProps],
	);

	return (
		<div
			ref={ref}
			className={classNames(className, { dragging })}
			draggable={true}
			data-drag-handle
			style={style}
			onMouseDown={onMouseDown}
			onDoubleClick={onDoubleClick}
			onDragStart={onDragStart}
			onMouseEnter={onMouseEnter}
		>
			<div className="title">{title}</div>
			{properties.length > 0 && (
				<div className="content">
					<div className="chips">{properties}</div>
				</div>
			)}
		</div>
	);
});

export default styled(CardPreview)`
	padding: 1rem;
	width: 100%;
	max-width: 19em;
	font-size: 0.9em;
	border-radius: var(--radius-medium);
	border: 1px solid var(--color-line);
	background-color: var(--color-article-bg);
	box-sizing: border-box;
	cursor: pointer;

	a:hover {
		text-decoration: none !important;
	}

	:active {
		animation: rotate 0.15s ease-in forwards;
	}

	&.dragging {
		box-shadow: var(--comment-tooltip-shadow);
	}

	:hover {
		background-color: var(--color-block);
		box-shadow: 0px 0px 12px -5px rgb(0 0 0 / 25%);
	}

	.title {
		text-decoration: none !important;
		cursor: pointer;
		line-height: 1.3em !important;
		color: var(--color-article-text) !important;
		font-weight: 400;
		height: 2.5em;
		text-overflow: ellipsis;
		word-wrap: break-word;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		max-height: 2.5em;
		pointer-events: none;
	}

	.content {
		margin-top: 0.25rem;
		display: flex;
		flex-direction: column;
		line-height: 1.3em !important;
	}

	.chips {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		word-wrap: break-word;
		margin-top: 0.5em;
		gap: 0.5em;
		font-size: 0.65em;
	}
`;
