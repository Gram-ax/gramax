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
  s3.put(&format!("dev/{part1}/latest/gramax.darwin-aarch64.dmg.version"), version.to_string()).await?;
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
  s3.put(&format!("dev/{part1}/latest/gramax.linux-x86_64.deb.version"), version.to_string()).await?;
  s3.put(&format!("dev/{part1}/{part2}/linux-x86_64/gramax.linux-x86_64.deb"), "app").await?;
  s3.put(&format!("dev/{part1}/{part2}/linux-x86_64/gramax.linux-x86_64.deb.sig"), "sig").await?;
  Ok(())
}

async fn prepare_windows_nsis(s3: &S3Client, version: semver::Version) -> anyhow::Result<()> {
  let (part1, part2) = version.split();
  s3.put("dev/latest/gramax.windows-x86_64.nsis.version", version.to_string()).await?;
  s3.put(&format!("dev/{part1}/latest/gramax.windows-x86_64.nsis.version"), version.to_string()).await?;
  s3.put(&format!("dev/{part1}/{part2}/windows-x86_64/gramax.windows-x86_64.setup.exe"), "app").await?;
  s3.put(&format!("dev/{part1}/{part2}/windows-x86_64/gramax.windows-x86_64.setup.exe.sig"), "sig").await?;
  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_darwin_basic() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_darwin_aarch64(&s3, "1.0.0".parse().unwrap()).await?;
  prepare_darwin_aarch64(&s3, "2.0.0".parse().unwrap()).await?;
  prepare_darwin_aarch64(&s3, "3.0.0".parse().unwrap()).await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev")
    .method(Method::GET)
    .header("x-gx-desired-app-version", "2.0.0")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::OK);

  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  let update: Update = serde_json::from_slice(&bytes)?;

  assert2::check!(update.version == "2.0.0".parse().unwrap(), "Should return requested version 2.0.0");
  assert2::check!(update.signature == "sig");
  assert2::check!(
    update.url
      == s3.base_url().await.with_path([
        "dev",
        "2.0",
        "0",
        "darwin-aarch64",
        "gramax.darwin-aarch64.update.tar.gz",
      ])
  );

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_linux_deb() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_linux_deb(&s3, "1.5.0".parse().unwrap()).await?;
  prepare_linux_deb(&s3, "2.5.0".parse().unwrap()).await?;

  let req = make_req("/linux-x86_64/updates?channel=dev&package=deb")
    .method(Method::GET)
    .header("x-gx-desired-app-version", "1.5.0")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::OK);

  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  let update: Update = serde_json::from_slice(&bytes)?;

  assert2::check!(update.version == "1.5.0".parse().unwrap());
  assert2::check!(update.signature == "sig");
  assert2::check!(
    update.url
      == s3.base_url().await.with_path(["dev", "1.5", "0", "linux-x86_64", "gramax.linux-x86_64.deb"])
  );

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_windows_nsis() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_windows_nsis(&s3, "1.2.3".parse().unwrap()).await?;
  prepare_windows_nsis(&s3, "2.3.4".parse().unwrap()).await?;

  let req = make_req("/windows-x86_64/updates?channel=dev&package=nsis")
    .method(Method::GET)
    .header("x-gx-desired-app-version", "1.2.3")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::OK);

  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  let update: Update = serde_json::from_slice(&bytes)?;

  assert2::check!(update.version == "1.2.3".parse().unwrap());
  assert2::check!(update.signature == "sig");
  assert2::check!(
    update.url
      == s3.base_url().await.with_path([
        "dev",
        "1.2",
        "3",
        "windows-x86_64",
        "gramax.windows-x86_64.setup.exe"
      ])
  );

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_not_found() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_darwin_aarch64(&s3, "1.0.0".parse().unwrap()).await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev")
    .method(Method::GET)
    .header("x-gx-desired-app-version", "2.0.0")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::NOT_FOUND, "Should return 404 for non-existent version 2.0.0");

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_same_as_current() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_darwin_aarch64(&s3, "1.0.0".parse().unwrap()).await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev")
    .method(Method::GET)
    .header("x-gx-app-version", "1.0.0")
    .header("x-gx-desired-app-version", "1.0.0")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(
    res.status() == StatusCode::NO_CONTENT,
    "Should return 204 when requested version is same as current"
  );

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_with_prerelease() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_darwin_aarch64(&s3, "1.0.0-1".parse().unwrap()).await?;
  prepare_darwin_aarch64(&s3, "1.1.0-2".parse().unwrap()).await?;
  prepare_darwin_aarch64(&s3, "1.0.3-3".parse().unwrap()).await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev")
    .method(Method::GET)
    .header("x-gx-desired-app-version", "1.1.0-2")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::OK);

  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  let update: Update = serde_json::from_slice(&bytes)?;

  assert2::check!(update.version == "1.1.0-2".parse().unwrap(), "Should return specific prerelease version");
  assert2::check!(update.signature == "sig");

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_ignores_latest_when_desired_specified() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_darwin_aarch64(&s3, "1.0.0".parse().unwrap()).await?;
  prepare_darwin_aarch64(&s3, "2.0.0".parse().unwrap()).await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev")
    .method(Method::GET)
    .header("x-gx-desired-app-version", "1.0.0")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::OK);

  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  let update: Update = serde_json::from_slice(&bytes)?;

  assert2::check!(
    update.version == "1.0.0".parse().unwrap(),
    "Should return requested version 1.0.0, not latest 2.0.0"
  );
  assert2::check!(
    update.url
      == s3.base_url().await.with_path([
        "dev",
        "1.0",
        "0",
        "darwin-aarch64",
        "gramax.darwin-aarch64.update.tar.gz",
      ])
  );

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_with_package_header() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_linux_deb(&s3, "1.0.0".parse().unwrap()).await?;
  prepare_linux_deb(&s3, "2.0.0".parse().unwrap()).await?;

  let req = make_req("/linux-x86_64/updates?channel=dev")
    .method(Method::GET)
    .header("x-gx-package", "deb")
    .header("x-gx-desired-app-version", "1.0.0")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(
    res.status() == StatusCode::OK,
    "Should work with package specified in header instead of query parameter"
  );

  let bytes = to_bytes(res.into_body(), usize::MAX).await?;
  let update: Update = serde_json::from_slice(&bytes)?;

  assert2::check!(update.version == "1.0.0".parse().unwrap());
  assert2::check!(
    update.url
      == s3.base_url().await.with_path(["dev", "1.0", "0", "linux-x86_64", "gramax.linux-x86_64.deb"])
  );

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_missing_signature_returns_404() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", "1.0.0").await?;
  s3.put("dev/1.0/latest/gramax.darwin-aarch64.dmg.version", "1.0.0").await?;
  s3.put("dev/1.0/0/darwin-aarch64/gramax.darwin-aarch64.dmg", "app").await?;
  s3.put("dev/1.0/0/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz", "app update").await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev")
    .method(Method::GET)
    .header("x-gx-desired-app-version", "1.0.0")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::NOT_FOUND, "Should return 404 when signature is missing");

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_missing_update_artifact_returns_404() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", "1.0.0").await?;
  s3.put("dev/1.0/latest/gramax.darwin-aarch64.dmg.version", "1.0.0").await?;
  s3.put("dev/1.0/0/darwin-aarch64/gramax.darwin-aarch64.dmg", "app").await?;
  s3.put("dev/1.0/0/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig", "sig").await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev")
    .method(Method::GET)
    .header("x-gx-desired-app-version", "1.0.0")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  assert2::check!(res.status() == StatusCode::NOT_FOUND, "Should return 404 when update artifact is missing");

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_nonexistent_prerelease_returns_404() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_darwin_aarch64(&s3, "1.0.0-1".parse().unwrap()).await?;
  prepare_darwin_aarch64(&s3, "1.0.0-2".parse().unwrap()).await?;
  prepare_darwin_aarch64(&s3, "1.0.0-3".parse().unwrap()).await?;

  prepare_darwin_aarch64(&s3, "2.0.0-1".parse().unwrap()).await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev")
    .method(Method::GET)
    .header("x-gx-desired-app-version", "1.0.0-0")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  let bytes = to_bytes(res.into_body(), usize::MAX).await?;

  let update = serde_json::from_slice::<Update>(&bytes)?;
  assert2::check!(update.version == "1.0.0-3".parse().unwrap(), "version should be 1.0.0-3");
  assert2::check!(update.signature == "sig", "Should return signature");

  Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_exact_version_should_return_latest() -> anyhow::Result<()> {
  let s3 = S3Client::new().await.with_uniq_bucket().await;
  let mut app = updater(s3.base_url().await);

  prepare_darwin_aarch64(&s3, "1.0.0-1".parse().unwrap()).await?;
  prepare_darwin_aarch64(&s3, "1.0.0-2".parse().unwrap()).await?;
  prepare_darwin_aarch64(&s3, "1.0.0-3".parse().unwrap()).await?;

  let req = make_req("/darwin-aarch64/updates?channel=dev")
    .method(Method::GET)
    .header("x-gx-desired-app-version", "1.0.0-2")
    .body(Body::empty())
    .unwrap();

  let res = app.call(req).await.unwrap();
  let bytes = to_bytes(res.into_body(), usize::MAX).await?;

  let update = serde_json::from_slice::<Update>(&bytes)?;
  assert2::check!(update.version == "1.0.0-3".parse().unwrap(), "version should be 1.0.0-3");
  assert2::check!(update.signature == "sig", "Should return signature");

  Ok(())
}
