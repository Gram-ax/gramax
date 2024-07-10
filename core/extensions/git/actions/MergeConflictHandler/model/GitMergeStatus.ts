enum GitMergeStatus {
    BothModified = "bothModified",

    AddedByUs = "addedByUs",
    AddedByThem = "addedByThem",
    BothAdded = "bothAdded",
    
    DeletedByUs = "deletedByUs",
    DeletedByThem = "deletedByThem",
    BothDeleted = "bothDeleted",
}

export default GitMergeStatus