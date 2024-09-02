import ArticlePublishTrigger from "@ext/git/actions/Publish/components/ArticlePublishTrigger";
import ConnectStorage from "../../../../extensions/catalog/actions/ConnectStorage";
import Branch from "../../../../extensions/git/actions/Branch/components/Branch";
import Sync from "../../../../extensions/git/actions/Sync/components/Sync";
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
								<ArticlePublishTrigger changesCount={changesCount} />
							</IsReadOnlyHOC>,
					  ]
			}
		/>
	);
};

export default ArticleStatusBar;
