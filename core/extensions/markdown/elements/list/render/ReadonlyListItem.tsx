import ListItem, { ListItemProps } from "./ListItem";

const ReadonlyListItem = (props: ListItemProps) => {
	return <ListItem {...props} isReadOnly />;
};

export default ReadonlyListItem;
