import { classNames } from "@components/libs/classNames";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import AddProperty from "@ext/properties/components/Helpers/AddProperty";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";
import Property from "@ext/properties/components/Property";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { Property as PropertyType, PropertyTypes } from "@ext/properties/models";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { CSSProperties, forwardRef, MouseEvent, useMemo } from "react";

interface CardProps {
	otherProps: PropertyType[];
	title?: string;
	className?: string;
	style?: CSSProperties;
	dragging?: boolean;
	isReadOnly?: boolean;
	removeLink?: () => void;
	onMouseEnter?: (e: MouseEvent) => void;
	onDoubleClick?: (e: MouseEvent) => void;
	onSubmit?: (propertyName: string, value: string, isDelete?: boolean) => void;
}

const CardPreview = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
	const catalogProperties = PropertyServiceProvider.value?.properties;
	const {
		title = t("article.no-name"),
		otherProps,
		className,
		style,
		dragging,
		isReadOnly,
		onMouseEnter,
		onDoubleClick,
		onSubmit,
		removeLink,
	} = props;

	const properties = useMemo(
		() =>
			otherProps.map((property) => {
				const isFlag = property.type === PropertyTypes.flag;
				return (
					<PropertyArticle
						disabled={dragging || isReadOnly}
						key={property.name}
						onSubmit={onSubmit}
						property={property}
						trigger={
							<div>
								<Property
									icon={property.icon}
									key={property.name}
									name={property.name}
									propertyStyle={property.style}
									shouldShowValue={!isFlag}
									type={property.type}
									value={!isFlag ? property.value : property.name}
								/>
							</div>
						}
					/>
				);
			}),
		[otherProps],
	);

	return (
		<div
			className={classNames(className, { dragging })}
			data-drag-handle
			draggable={true}
			onDoubleClick={onDoubleClick}
			onDragStart={removeLink}
			onMouseDown={removeLink}
			onMouseEnter={onMouseEnter}
			ref={ref}
			style={style}
		>
			<div className="card-title" onMouseEnter={onMouseEnter}>
				{title}
			</div>
			{properties.length > 0 && (
				<div className="card-content" onMouseMove={removeLink}>
					<div className="chips">
						{properties}
						{!dragging && !isReadOnly && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<ButtonLink dataQa="kanban-add-property" iconCode="plus" />
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<AddProperty
										catalogProperties={catalogProperties}
										disabled={dragging || isReadOnly}
										onSubmit={onSubmit}
										properties={otherProps}
									/>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
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

	&.dragging {
		box-shadow: var(--comment-tooltip-shadow);
	}

	:hover {
		background-color: var(--color-block);
		box-shadow: 0px 0px 12px -5px rgb(0 0 0 / 25%);
	}

	.card-title {
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
	}

	.card-content {
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
