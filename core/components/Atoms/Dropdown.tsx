import Icon from "@components/Atoms/Icon";
import Input from "@components/Atoms/Input";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import styled from "@emotion/styled";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { Instance, Props } from "tippy.js";

const StyledPopupMenuLayout = styled(PopupMenuLayout)`
	overflow: auto;
	max-width: 20em;
	max-height: 20em;
`;

const ItemWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	overflow: hidden;
	max-width: 100%;
	flex-wrap: wrap;
	word-wrap: break-word;
	white-space: normal !important;
	color: inherit;

	> span:first-of-type {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 90%;
	}
`;

const StyledNoResults = styled.div`
	display: block !important;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap !important;
`;

const StyledInput = styled(Input)`
	max-width: 100%;

	.textInput {
		max-width: 100%;
	}
`;

interface DropdownProps {
	trigger: JSX.Element;
	items: string[];
	searchable?: boolean;
	placeholder?: string;
	item?: string;
	noResults?: string;
	onOpen?: () => void;
	onClose?: () => void;
	onItemClick?: (item: string) => void;
}

const Dropdown = (props: DropdownProps) => {
	const {
		trigger,
		items: itemsProp,
		onItemClick,
		item: selectedItem,
		placeholder,
		searchable,
		onOpen: onOpenProp,
		onClose: onCloseProp,
		noResults,
	} = props;
	const [isOpen, setIsOpen] = useState(false);
	const [filteredItems, setFilteredItems] = useState(itemsProp);
	const instanceRef = useRef<Instance<Props>>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const onOpen = () => {
		setIsOpen(true);
		onOpenProp?.();
	};

	const onClose = () => {
		setIsOpen(false);
		onCloseProp?.();

		if (inputRef.current) inputRef.current.value = "";
		setFilteredItems(itemsProp);
	};

	const onTippyMount = (instance: Instance<Props>) => {
		instanceRef.current = instance;
	};

	const onItemClickHandler = (item: string) => {
		onItemClick?.(item);
		const instance = instanceRef.current;

		if (instance) instance.hide();
	};

	const items = useMemo(() => {
		return filteredItems.map((item) => (
			<ItemWrapper className="popup-button" key={item} onClick={() => onItemClickHandler(item)}>
				<span>{item}</span>
				{item === selectedItem && <Icon code="check" />}
			</ItemWrapper>
		));
	}, [filteredItems, onItemClick, selectedItem]);

	const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setFilteredItems(itemsProp.filter((item) => item.toLowerCase().includes(value.toLowerCase())));

		const instance = instanceRef.current;
		if (instance) instance.popper.style.width = instance.popper.clientWidth + "px";
	};

	return (
		<StyledPopupMenuLayout
			openTrigger="click"
			placement="bottom-end"
			onTippyMount={onTippyMount}
			hideOnClick={false}
			trigger={trigger}
			isOpen={isOpen}
			onOpen={onOpen}
			onClose={onClose}
			appendTo={() => document.body}
		>
			<>
				{searchable && isOpen && (
					<StyledInput placeholder={placeholder} onChange={onInputChange} ref={inputRef} />
				)}
				{isOpen && items.length === 0 && searchable && noResults && (
					<StyledNoResults>{noResults}</StyledNoResults>
				)}
				{isOpen && items}
			</>
		</StyledPopupMenuLayout>
	);
};

export default Dropdown;
