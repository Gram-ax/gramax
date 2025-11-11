use super::*;
use axum::body::to_bytes;
use axum::body::Body;
use axum::http::Method;
use reqwest::StatusCode;
use spa::updater::s3::SplitVersion;
use spa::updater::*;
use tower::Service;

async fn prepare_darwin_aarch64(s3: &S3Client, version: semver::Version) -> anyhow::Result<()> {
  let (part1, part2) = version.split();
  s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", version.to_string()).await?;
  s3.put(&format!("dev/{part1}/{part2}/darwin-aarch64/gramax.darwin-aarch64.dmg"), "app").await?;
  s3.put(&format!("dev/{part1}/{part2}/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz"), "app update")
    .await?;
  s3.put(&format!("dev/{part1}/{part2}/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig"), "sig")
    .await?;
  Ok(())
}

async fn prepare_linux_deb(s3: &S3Client, version: semver::Version) -> anyhow::Result<()> {
  let (part1, part2) = version.split();
  s3.put("dev/latest/gramax.linux-x86_64.deb.version", version.to_string()).await?;
  s3.put(&format!("dev/{part1}/{part2}/linux-x86_64/gramax.linux-x86_64.deb"), "app").await?;
  s3.put(&format!("dev/{part1}/{part2}/linux-x86_64/gramax.linux-x86_64.deb.sig"), "sig").await?;
  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_update_darwin_basic() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_darwin_aarch64(&s3, "1.1.1".parse().unwrap()).await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev").method(Method::GET).body(Body::empty()).unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::OK);

  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  let update: Update = serde_json::from_slice(&bytes)?;

  assert2::check!(update.version == "1.1.1".parse().unwrap());
  assert2::check!(update.signature == "sig");
  assert2::check!(
    update.url
      == s3.base_url().await.with_path([
        "dev",
        "1.1",
        "1",
        "darwin-aarch64",
        "gramax.darwin-aarch64.update.tar.gz",
      ])
  );

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_update_no_update_required() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_darwin_aarch64(&s3, "2025.10.8-104".parse().unwrap()).await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev")
    .method(Method::GET)
    .header("x-gx-app-version", "2025.10.8-mac-silicon.104")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::NO_CONTENT);

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_update_refreshes_on_latest_change() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_darwin_aarch64(&s3, "1.1.1".parse().unwrap()).await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev").method(Method::GET).body(Body::empty()).unwrap();
  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::OK);
  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  let update: Update = serde_json::from_slice(&bytes)?;
  assert2::check!(update.version == "1.1.1".parse().unwrap());

  // change latest pointer and provide new artifacts
  prepare_darwin_aarch64(&s3, "2.2.2".parse().unwrap()).await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev").method(Method::GET).body(Body::empty()).unwrap();
  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::OK);
  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  let update: Update = serde_json::from_slice(&bytes)?;
  assert2::check!(update.version == "2.2.2".parse().unwrap());

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_update_linux_deb_with_package_param() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_linux_deb(&s3, "4.4.4".parse().unwrap()).await?;

  let req = make_req("/linux-x86_64/updates?channel=dev&package=deb")
    .method(Method::GET)
    .body(Body::empty())
    .unwrap();
  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::OK);
  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  let update: Update = serde_json::from_slice(&bytes)?;

  assert2::check!(update.version == "4.4.4".parse().unwrap());
  assert2::check!(update.signature == "sig");
  assert2::check!(
    update.url
      == s3.base_url().await.with_path(["dev", "4.4", "4", "linux-x86_64", "gramax.linux-x86_64.deb",])
  );

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_update_linux_deb_with_package_header() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_linux_deb(&s3, "4.4.4".parse().unwrap()).await?;

  let req = make_req("/linux-x86_64/updates?channel=dev")
    .header("x-gx-package", "deb")
    .method(Method::GET)
    .body(Body::empty())
    .unwrap();
  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::OK);
  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  let update: Update = serde_json::from_slice(&bytes)?;

  assert2::check!(update.version == "4.4.4".parse().unwrap());
  assert2::check!(update.signature == "sig");
  assert2::check!(
    update.url
      == s3.base_url().await.with_path(["dev", "4.4", "4", "linux-x86_64", "gramax.linux-x86_64.deb",])
  );

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_update_not_found_returns_404() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  let req = make_req("/darwin-aarch64/updates?channel=dev").method(Method::GET).body(Body::empty()).unwrap();
  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::NOT_FOUND);
  Ok(())
}
