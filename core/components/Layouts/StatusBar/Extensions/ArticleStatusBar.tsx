import ConnectStorage from "../../../../extensions/catalog/actions/ConnectStorage";
import Branch from "../../../../extensions/git/actions/Branch/components/Branch";
import Publish from "../../../../extensions/git/actions/Publish/components/Publish";
import Sync from "../../../../extensions/git/actions/Sync/Sync";
import IsReadOnlyHOC from "../../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import StatusBar from "../StatusBar";

const ArticleStatusBar = ({ isStorageInitialized, padding }: { isStorageInitialized: boolean; padding?: string }) => {
	const changesCount: number = null;

	return (
		<StatusBar
			padding={padding}
			leftElements={isStorageInitialized ? [<Branch key={0} />] : []}
			rightElements={
				!isStorageInitialized
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
