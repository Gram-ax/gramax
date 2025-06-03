enum OnBranchUpdateCaller {
	Init = "init",
	Checkout = "checkout",
	CheckoutToNewCreatedBranch = "checkout-to-new-created-branch",
	MergeRequest = "merge-request",
	DiscardNoReset = "discard-no-reset",
	Publish = "publish",
}

export default OnBranchUpdateCaller;
