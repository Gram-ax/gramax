use super::*;
use assert2::let_assert;
use spa::updater::*;

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_latest_update_basic_test() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;

  // darwin aarch64 dmg artifacts for 1.1.1
  s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", "1.1.1").await?;
  s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.dmg", "app").await?;
  s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz", "app update").await?;
  s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig", "sig").await?;

  // prepare 2.2.2 but do not point latest to it yet
  s3.put("dev/2.2/2/darwin-aarch64/gramax.darwin-aarch64.dmg", "app2").await?;
  s3.put("dev/2.2/2/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz", "app update2").await?;
  s3.put("dev/2.2/2/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig", "sig2").await?;

  let store = ArtifactStore::new(s3.base_url().await);
  let channel = store.channel(Channel::Dev);

  // initially cache is empty -> not found
  let err = channel.get_latest_update(PlatformPackage::DarwinAarch64Dmg).await.unwrap_err();
  assert2::let_assert!(ArtifactUpdateError::NotFound = err);

  // fetch latest versions into cache
  channel.update_latest_versions().await?;

  // should return latest 1.1.1
  let update = channel.get_latest_update(PlatformPackage::DarwinAarch64Dmg).await?;
  assert_eq!(update.version, "1.1.1".parse().unwrap());
  assert_eq!(update.signature, "sig");
  assert_eq!(
    update.s3_url,
    s3.base_url().await.with_path(["dev", "1.1", "1", "darwin-aarch64", "gramax.darwin-aarch64.update.tar.gz"])
  );

  // change latest pointer -> cache becomes outdated but doesn't reports it
  s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", "2.2.2").await?;
  channel.get_latest_update(PlatformPackage::DarwinAarch64Dmg).await.unwrap();

  // refresh and verify 2.2.2
  channel.update_latest_versions().await?;
  let update = channel.get_latest_update(PlatformPackage::DarwinAarch64Dmg).await?;
  assert_eq!(update.version, "2.2.2".parse().unwrap());
  assert_eq!(update.signature, "sig2");
  assert_eq!(
    update.s3_url,
    s3.base_url().await.with_path(["dev", "2.2", "2", "darwin-aarch64", "gramax.darwin-aarch64.update.tar.gz"])
  );

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_latest_update_linux_deb() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;

  s3.put("dev/latest/gramax.linux-x86_64.deb.version", "1.1.1").await?;
  s3.put("dev/1.1/1/linux-x86_64/gramax.linux-x86_64.deb", "app").await?;
  s3.put("dev/1.1/1/linux-x86_64/gramax.linux-x86_64.deb.sig", "sig").await?;

  let store = ArtifactStore::new(s3.base_url().await);
  let channel = store.channel(Channel::Dev);
  channel.update_latest_versions().await?;

  let update = channel.get_latest_update(PlatformPackage::LinuxDeb).await?;
  assert_eq!(update.version, "1.1.1".parse().unwrap());

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_latest_update_not_found() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;

  let store = ArtifactStore::new(s3.base_url().await);
  let channel = store.channel(Channel::Dev);
  channel.update_latest_versions().await?;

  let res = channel.get_latest_update(PlatformPackage::DarwinAarch64Dmg).await;
  let_assert!(Err(ArtifactUpdateError::NotFound) = res); // should return needs update because no artifacts are present

  Ok(())
}
