use super::*;
use assert2::let_assert;
use spa::updater::*;

// avoid bringing conflicting assert macros

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn installer_download_url() -> anyhow::Result<()> {
	let s3 = S3Client::new().await.with_uniq_bucket().await;

	// prepare artifacts for 1.1.1
	s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", "1.1.1").await?;
	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.dmg", "app").await?;
	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz", "appu").await?;
	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig", "sig").await?;

	let store = ArtifactStore::new(s3.base_url().await);
	let channel = store.channel(Channel::Dev);

	// not updated -> needs update
	let res = channel.latest_installer_download_url(PlatformPackage::DarwinAarch64Dmg).await;
	assert2::let_assert!(Err(ArtifactUpdateError::NotFound) = res);

	channel.update_latest_versions().await?;

	let (url, _) = channel.latest_installer_download_url(PlatformPackage::DarwinAarch64Dmg).await?;

	assert_eq!(
		url,
		s3.base_url()
			.await
			.with_path(["dev", "1.1", "1", "darwin-aarch64", "gramax.darwin-aarch64.dmg"]),
		"should resolve latest installer url to 1.1.1"
	);

	let data = reqwest::get(url).await?.bytes().await?;
	assert_eq!(data, "app");

	Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn update_download_url_via_latest_update() -> anyhow::Result<()> {
	let s3 = S3Client::new().await.with_uniq_bucket().await;

	s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", "1.1.1").await?;

	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.dmg", "app").await?;
	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz", "update").await?;
	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig", "sig").await?;

	let store = ArtifactStore::new(s3.base_url().await);
	let channel = store.channel(Channel::Dev);

	channel.update_latest_versions().await?;

	let update = channel.get_latest_update(PlatformPackage::DarwinAarch64Dmg).await?;
	assert_eq!(
		update.s3_url,
		s3.base_url()
			.await
			.with_path(["dev", "1.1", "1", "darwin-aarch64", "gramax.darwin-aarch64.update.tar.gz"])
	);

	let data = reqwest::get(update.s3_url).await?.bytes().await?;
	assert_eq!(data, "update");

	Ok(())
}

#[rstest]
pub fn list_objects_url_for_base_at_bucket_root() {
	let base = S3BaseUrl("http://s3.example.com/bucket".parse().unwrap());
	let channel = base.channel(Channel::Dev);

	assert_eq!(channel.list_key_prefix(), "dev/");
	assert_eq!(
		channel.list_objects_url(None, false, None).as_str(),
		"http://s3.example.com/bucket?list-type=2&prefix=dev%2F"
	);
	assert_eq!(
		channel.list_objects_url(None, false, Some("token-1")).as_str(),
		"http://s3.example.com/bucket?list-type=2&prefix=dev%2F&continuation-token=token-1"
	);
	assert_eq!(
		channel.list_objects_url(None, true, None).as_str(),
		"http://s3.example.com/bucket?list-type=2&prefix=dev%2F&delimiter=%2F"
	);
	assert_eq!(
		channel.list_objects_url(Some("2026.7/"), false, None).as_str(),
		"http://s3.example.com/bucket?list-type=2&prefix=dev%2F2026.7%2F"
	);
}

#[rstest]
pub fn list_objects_url_for_base_inside_bucket_path() {
	let base = S3BaseUrl("http://s3.example.com/bucket/gramax".parse().unwrap());
	let channel = base.channel(Channel::Prod);

	assert_eq!(channel.list_key_prefix(), "gramax/prod/");
	assert_eq!(
		channel.list_objects_url(None, false, None).as_str(),
		"http://s3.example.com/bucket?list-type=2&prefix=gramax%2Fprod%2F"
	);
}

#[rstest]
pub fn list_objects_url_for_base_without_path() {
	let base = S3BaseUrl("http://bucket.s3.example.com".parse().unwrap());
	let channel = base.channel(Channel::Dev);

	assert_eq!(channel.list_key_prefix(), "dev/");
	assert_eq!(
		channel.list_objects_url(None, false, None).as_str(),
		"http://bucket.s3.example.com/?list-type=2&prefix=dev%2F"
	);
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn update_latest_versions_fails_not_all_packages_are_present() -> anyhow::Result<()> {
	let s3 = S3Client::new().await.with_uniq_bucket().await;

	s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", "1.1.1").await?;
	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.dmg", "app").await?;

	let store = ArtifactStore::new(s3.base_url().await);
	let channel = store.channel(Channel::Dev);

	assert!(channel.needs_update(PlatformPackage::WindowsX86_64Nsis).await?);

	let res = channel.update_latest_versions().await;
	let_assert!(Err(ArtifactUpdateError::LatestFetchFailed(_)) = res);

	Ok(())
}
