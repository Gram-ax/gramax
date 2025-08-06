import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";

type ClientSyncResult = { mergeData: MergeData; isVersionChanged: boolean; before: string; after: string };

export default ClientSyncResult;
