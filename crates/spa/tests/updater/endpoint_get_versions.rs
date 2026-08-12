use super::*;
use axum::body::to_bytes;
use axum::body::Body;
use axum::http::Method;
use reqwest::StatusCode;
use spa::updater::Package;
use spa::updater::Platform;
use spa::updater::VersionList;
use tower::Service;

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn versions_listed_newest_first_with_available_packages() -> anyhow::Result<()> {
	let s3 = S3Client::new().await.with_uniq_bucket().await;
	let mut app = updater(s3.base_url().await);

	// latest pointer must not show up as a version
	s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", "1.2.0").await?;

	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.dmg", "app").await?;
	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz", "update").await?;
	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig", "sig").await?;
	s3.put("dev/1.1/1/windows-x86_64/gramax.windows-x86_64.setup.exe", "setup").await?;

	s3.put("dev/1.2/0-rc.1/darwin-aarch64/gramax.darwin-aarch64.dmg", "rc").await?;
	s3.put("dev/1.2/0/linux-x86_64/gramax.linux-x86_64.deb", "deb").await?;

	let req = make_req("/versions?channel=dev").method(Method::GET).body(Body::empty()).unwrap();
	let res = app.call(req).await.unwrap();
	assert2::check!(res.status() == StatusCode::OK);

	let bytes = to_bytes(res.into_body(), usize::MAX).await?;
	let body = String::from_utf8(bytes.to_vec())?;

	// installers only: update archives and signatures are never exposed
	assert2::check!(!body.contains("update.tar.gz"));
	assert2::check!(!body.contains(".sig"));

	let list: VersionList = serde_json::from_str(&body)?;

	let versions: Vec<String> = list.versions.iter().map(|v| v.version.to_string()).collect();
	assert2::check!(versions == ["1.2.0", "1.2.0-rc.1", "1.1.1"]);

	let packages_of = |index: usize| -> Vec<(Platform, Package)> { list.versions[index].packages.iter().map(|p| (p.platform, p.package)).collect() };

	assert2::check!(packages_of(0) == [(Platform::Linux, Package::Deb)]);
	assert2::check!(packages_of(1) == [(Platform::DarwinAarch64, Package::Dmg)]);
	assert2::check!(packages_of(2) == [(Platform::WindowsX86_64, Package::Nsis), (Platform::DarwinAarch64, Package::Dmg)]);

	let filenames: Vec<&str> = list.versions[2].packages.iter().map(|p| p.filename.as_str()).collect();
	assert2::check!(filenames == ["Gramax.1.1.1.setup.exe", "Gramax.1.1.1.dmg"]);

	Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn versions_cache_dropped_when_update_endpoint_discovers_new_release() -> anyhow::Result<()> {
	let s3 = S3Client::new().await.with_uniq_bucket().await;
	let mut app = updater(s3.base_url().await);

	s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", "1.1.1").await?;
	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.dmg", "app").await?;
	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz", "update").await?;
	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig", "sig").await?;

	let versions = |app: &mut axum::Router| {
		let req = make_req("/versions?channel=dev").method(Method::GET).body(Body::empty()).unwrap();
		app.call(req)
	};

	let check_updates = |app: &mut axum::Router| {
		let req = make_req("/darwin-aarch64/updates?channel=dev&package=dmg")
			.method(Method::GET)
			.body(Body::empty())
			.unwrap();
		app.call(req)
	};

	// prime the latest cache (stores the pointer etag) and the versions cache
	check_updates(&mut app).await.unwrap();
	let res = versions(&mut app).await.unwrap();
	let list: VersionList = serde_json::from_slice(&to_bytes(res.into_body(), usize::MAX).await?)?;
	assert2::check!(list.versions.len() == 1);

	// a new release lands on s3
	s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", "1.1.2").await?;
	s3.put("dev/1.1/2/darwin-aarch64/gramax.darwin-aarch64.dmg", "app2").await?;
	s3.put("dev/1.1/2/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz", "update2").await?;
	s3.put("dev/1.1/2/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig", "sig2").await?;

	// the versions listing is still served from cache
	let res = versions(&mut app).await.unwrap();
	let list: VersionList = serde_json::from_slice(&to_bytes(res.into_body(), usize::MAX).await?)?;
	assert2::check!(list.versions.len() == 1);

	// the update endpoint notices the new release (etag mismatch) and must drop the cache
	check_updates(&mut app).await.unwrap();

	let res = versions(&mut app).await.unwrap();
	let list: VersionList = serde_json::from_slice(&to_bytes(res.into_body(), usize::MAX).await?)?;
	let listed: Vec<String> = list.versions.iter().map(|v| v.version.to_string()).collect();
	assert2::check!(listed == ["1.1.2", "1.1.1"]);

	Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn versions_empty_for_channel_without_artifacts() -> anyhow::Result<()> {
	let s3 = S3Client::new().await.with_uniq_bucket().await;
	let mut app = updater(s3.base_url().await);

	s3.put("dev/1.1/1/darwin-aarch64/gramax.darwin-aarch64.dmg", "app").await?;

	// prod channel has no artifacts
	let req = make_req("/versions").method(Method::GET).body(Body::empty()).unwrap();
	let res = app.call(req).await.unwrap();
	assert2::check!(res.status() == StatusCode::OK);

	let bytes = to_bytes(res.into_body(), usize::MAX).await?;
	let list: VersionList = serde_json::from_slice(&bytes)?;
	assert2::check!(list.versions.is_empty());

	Ok(())
}
