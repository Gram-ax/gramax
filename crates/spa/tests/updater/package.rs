use spa::updater::{Package, Platform, PlatformPackage};

#[test]
fn platform_package_all_len_and_unique() {
	let all = PlatformPackage::all();
	assert_eq!(all.len(), 8);

	// ensure uniqueness
	use std::collections::HashSet;
	let set: HashSet<_> = all.into_iter().collect();
	assert_eq!(set.len(), 8);
}

#[test]
fn platform_package_pairs_match_as_pair() {
	for pp in PlatformPackage::all() {
		let (p, pkg) = pp.as_pair();
		// from_pair should invert as_pair
		let back = PlatformPackage::from_pair(p, pkg).expect("valid pair must convert back");
		assert_eq!(back, pp);
	}
}

#[test]
fn platform_package_from_pair_err_on_mismatch() {
	// pick a clearly invalid combination
	let err = PlatformPackage::from_pair(Platform::WindowsX86_64, Package::Dmg).unwrap_err();
	// error type equality is not derived; just ensure it's the expected variant via string
	let msg = err.to_string();
	assert!(msg.contains("invalid platform package pair"));
}
