use super::*;
use axum::body::to_bytes;
use axum::body::Body;
use axum::http::Method;
use reqwest::StatusCode;
use spa::updater::s3::SplitVersion;
use tower::Service;

async fn prepare_darwin_aarch64(s3: &S3Client, version: &str) -> anyhow::Result<()> {
  let (part1, part2) = semver::Version::parse(version)?.split();
  s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", version.to_string()).await?;
  s3.put(&format!("dev/{part1}/{part2}/darwin-aarch64/gramax.darwin-aarch64.dmg"), "app").await?;
  s3.put(&format!("dev/{part1}/{part2}/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz"), "app update")
    .await?;
  s3.put(&format!("dev/{part1}/{part2}/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig"), "sig")
    .await?;
  Ok(())
}

async fn prepare_linux_deb(s3: &S3Client, version: &str) -> anyhow::Result<()> {
  let (part1, part2) = semver::Version::parse(version)?.split();
  s3.put("dev/latest/gramax.linux-x86_64.deb.version", version.to_string()).await?;
  s3.put(&format!("dev/{part1}/{part2}/linux-x86_64/gramax.linux-x86_64.deb"), "deb-bytes").await?;
  s3.put(&format!("dev/{part1}/{part2}/linux-x86_64/gramax.linux-x86_64.deb.sig"), "deb-bytes").await?;
  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn download_darwin_aarch64_basic() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_darwin_aarch64(&s3, "1.1.1-1").await?;

  let req = make_req("/darwin-aarch64?channel=dev").method(Method::GET).body(Body::empty()).unwrap();
  let res = app.call(req).await.unwrap();

  assert2::check!(res.status() == StatusCode::OK);

  let headers = res.headers().clone();
  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  assert2::check!(bytes == "app");

  let cd =
    headers.get("Content-Disposition").expect("Content-Disposition header is missing").to_str().unwrap();

  assert2::check!(cd.contains("attachment;"));
  assert2::check!(cd.contains("Gramax.1.1.1-mac-silicon.1.dmg"));

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn download_linux_deb_with_package_param() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_linux_deb(&s3, "4.4.4-4").await?;

  let req =
    make_req("/linux-x86_64?channel=dev&package=deb").method(Method::GET).body(Body::empty()).unwrap();
  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::OK);

  let headers = res.headers().clone();
  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  assert2::check!(bytes == "deb-bytes");

  let cd =
    headers.get("Content-Disposition").expect("Content-Disposition header is missing").to_str().unwrap();

  assert2::check!(cd.contains("attachment;"));
  assert2::check!(cd.contains("Gramax.4.4.4-linux.4.deb"));

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn download_returns_404_when_missing() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  // no update or installer artifacts
  let req = make_req("/darwin-aarch64?channel=dev").method(Method::GET).body(Body::empty()).unwrap();
  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::NOT_FOUND);
  Ok(())
}
