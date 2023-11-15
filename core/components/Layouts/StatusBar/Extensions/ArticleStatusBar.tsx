import ConnectStorage from "../../../../extensions/catalog/actions/ConnectStorage";
import Branch from "../../../../extensions/git/actions/Branch/components/Branch";
import Publish from "../../../../extensions/git/actions/Publish/components/Publish";
import Sync from "../../../../extensions/git/actions/Sync/Sync";
import useIsStorageInitialized from "../../../../extensions/storage/logic/utils/useIsStorageIniziliate";
import IsReadOnlyHOC from "../../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import StatusBar from "../StatusBar";

const ArticleStatusBar = ({ padding }: { padding?: string }) => {
	const storageInitialized = useIsStorageInitialized();
	const changesCount: number = null;

	return (
		<StatusBar
			padding={padding}
			leftElements={storageInitialized ? [<Branch key={0} />] : []}
			rightElements={
				!storageInitialized
					? [<ConnectStorage key={0} />]
					: [
							<Sync key={0} style={{ height: "100%" }} />,
							<IsReadOnlyHOC key={1}>
								<Publish changesCount={changesCount} />
							</IsReadOnlyHOC>,
					  ]
			}
		/>
	);
};

export default ArticleStatusBar;
