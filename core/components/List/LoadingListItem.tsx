import SpinnerLoader from "../Atoms/SpinnerLoader";
import { ListItem } from "./Item";

const LoadingListItem: ListItem = {
	element: <SpinnerLoader fullScreen style={{ margin: "1rem" }} />,
	labelField: "",
	disable: true,
};

export default LoadingListItem;
