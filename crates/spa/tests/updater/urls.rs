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
    s3.base_url().await.with_path(["dev", "1.1", "1", "darwin-aarch64", "gramax.darwin-aarch64.dmg"]),
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
    s3.base_url().await.with_path([
      "dev",
      "1.1",
      "1",
      "darwin-aarch64",
      "gramax.darwin-aarch64.update.tar.gz"
    ])
  );

  let data = reqwest::get(update.s3_url).await?.bytes().await?;
  assert_eq!(data, "update");

  Ok(())
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
