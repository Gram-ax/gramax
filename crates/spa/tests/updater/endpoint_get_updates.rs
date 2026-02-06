use super::*;
use axum::body::to_bytes;
use axum::body::Body;
use reqwest::StatusCode;
use spa::updater::s3::SplitVersion;
use spa::updater::*;
use tower::Service;

use axum::http::Method;

async fn prepare_artifacts(s3: &S3Client, versions: [&str; 4]) -> anyhow::Result<()> {
	let [latest_darwin_aarch64, latest_darwin_x86_64, latest_linux_x86_64, latest_windows_x86_64_nsis] = versions;

	let [url_darwin_aarch64, url_darwin_x86_64, url_linux_x86_64, url_windows_x86_64_nsis] = versions
		.map(|v| semver::Version::parse(v).unwrap().split())
		.map(|(p1, p2)| format!("{p1}/{p2}"));

	s3.put("dev/latest/gramax.darwin-aarch64.dmg.version", latest_darwin_aarch64.to_string())
		.await?;
	s3.put(&format!("dev/{url_darwin_aarch64}/darwin-aarch64/gramax.darwin-aarch64.dmg"), "app")
		.await?;
	s3.put(
		&format!("dev/{url_darwin_aarch64}/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz"),
		"app update",
	)
	.await?;
	s3.put(
		&format!("dev/{url_darwin_aarch64}/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz.sig"),
		"sig",
	)
	.await?;

	s3.put("dev/latest/gramax.darwin-x86_64.dmg.version", latest_darwin_x86_64.to_string())
		.await?;
	s3.put(&format!("dev/{url_darwin_x86_64}/darwin-x86_64/gramax.darwin-x86_64.dmg"), "app")
		.await?;
	s3.put(
		&format!("dev/{url_darwin_x86_64}/darwin-x86_64/gramax.darwin-x86_64.update.tar.gz"),
		"app update",
	)
	.await?;
	s3.put(
		&format!("dev/{url_darwin_x86_64}/darwin-x86_64/gramax.darwin-x86_64.update.tar.gz.sig"),
		"sig",
	)
	.await?;

	s3.put("dev/latest/gramax.linux-x86_64.appimage.version", latest_linux_x86_64.to_string())
		.await?;
	s3.put(&format!("dev/{url_linux_x86_64}/linux-x86_64/gramax.linux-x86_64.appimage"), "app")
		.await?;
	s3.put(&format!("dev/{url_linux_x86_64}/linux-x86_64/gramax.linux-x86_64.appimage.sig"), "sig")
		.await?;

	s3.put("dev/latest/gramax.windows-x86_64.nsis.version", latest_windows_x86_64_nsis.to_string())
		.await?;
	s3.put(
		&format!("dev/{url_windows_x86_64_nsis}/windows-x86_64/gramax.windows-x86_64.setup.exe"),
		"app",
	)
	.await?;
	s3.put(
		&format!("dev/{url_windows_x86_64_nsis}/windows-x86_64/gramax.windows-x86_64.setup.exe.sig"),
		"sig",
	)
	.await?;

	Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_updates_basic_test() -> anyhow::Result<()> {
	let s3 = S3Client::new().await.with_uniq_bucket().await;
	let mut app = updater(s3.base_url().await);

	prepare_artifacts(&s3, ["1.1.1", "2.2.2", "3.3.3", "4.4.4"]).await?;

	let get_updates = make_req("/updates?channel=dev").method(Method::GET).body(Body::empty()).unwrap();

	let res = app.call(get_updates).await.unwrap();
	let status = res.status();
	let bytes = to_bytes(res.into_body(), usize::MAX).await?;
	assert2::check!(status == StatusCode::OK, "{}", String::from_utf8_lossy(&bytes));

	let release: Release = serde_json::from_slice(&bytes)?;

	let base_url = s3.base_url().await;

	assert2::check!(release.platforms.len() == 4);

	assert2::check!(
		release.platforms.get(&Platform::DarwinAarch64).unwrap().url
			== base_url
				.with_path(["dev", "1.1", "1", "darwin-aarch64", "gramax.darwin-aarch64.update.tar.gz"])
				.to_string()
	);

	assert2::check!(release.platforms.contains_key(&Platform::DarwinX86_64));
	assert2::check!(release.platforms.contains_key(&Platform::Linux));

	assert2::check!(
		release.platforms.get(&Platform::WindowsX86_64).unwrap().url
			== base_url
				.with_path(["dev", "4.4", "4", "windows-x86_64", "gramax.windows-x86_64.setup.exe"])
				.to_string()
	);
	assert2::check!(release.version == "1.1.1".parse().unwrap());

	Ok(())
}

#[rstest]
#[tokio::test(flavor = "multi_thread")]
pub async fn get_updates_update_latest_versions() -> anyhow::Result<()> {
	let s3 = S3Client::new().await.with_uniq_bucket().await;
	let mut app = updater(s3.base_url().await);

	prepare_artifacts(&s3, ["1.1.1", "1.1.1", "1.1.1", "1.1.1"]).await?;

	let get_updates = make_req("/updates?channel=dev").method(Method::GET).body(Body::empty()).unwrap();

	let res = app.call(get_updates).await.unwrap();
	assert2::check!(res.status() == StatusCode::OK);
	let bytes = to_bytes(res.into_body(), usize::MAX).await?;
	let release: Release = serde_json::from_slice(&bytes)?;
	assert2::check!(release.version == "1.1.1".parse().unwrap());

	let darwin_url = release.platforms.get(&Platform::DarwinAarch64).unwrap().url.clone();
	assert2::check!(
		darwin_url
			== s3
				.base_url()
				.await
				.with_path(["dev", "1.1", "1", "darwin-aarch64", "gramax.darwin-aarch64.update.tar.gz"])
				.to_string()
	);

	prepare_artifacts(&s3, ["2.2.2", "1.1.1", "3.3.3", "4.4.4"]).await?;

	let get_updates = make_req("/updates?channel=dev").method(Method::GET).body(Body::empty()).unwrap();

	let res = app.call(get_updates).await.unwrap();
	assert2::check!(res.status() == StatusCode::OK);
	let bytes = to_bytes(res.into_body(), usize::MAX).await?;
	let release: Release = serde_json::from_slice(&bytes)?;
	assert2::check!(release.version == "1.1.1".parse().unwrap());

	let darwin_url = release.platforms.get(&Platform::DarwinAarch64).unwrap().url.clone();
	assert2::check!(
		darwin_url
			== s3
				.base_url()
				.await
				.with_path(["dev", "2.2", "2", "darwin-aarch64", "gramax.darwin-aarch64.update.tar.gz"])
				.to_string()
	);

	prepare_artifacts(&s3, ["10.10.10", "10.10.10", "10.10.10", "10.10.10"]).await?;

	let get_updates = make_req("/updates?channel=dev").method(Method::GET).body(Body::empty()).unwrap();

	let res = app.call(get_updates).await.unwrap();
	assert2::check!(res.status() == StatusCode::OK);
	let bytes = to_bytes(res.into_body(), usize::MAX).await?;
	let release: Release = serde_json::from_slice(&bytes)?;
	assert2::check!(release.version == "10.10.10".parse().unwrap());

	let darwin_url = release.platforms.get(&Platform::DarwinAarch64).unwrap().url.clone();
	assert2::check!(
		darwin_url
			== s3
				.base_url()
				.await
				.with_path(["dev", "10.10", "10", "darwin-aarch64", "gramax.darwin-aarch64.update.tar.gz"])
				.to_string()
	);

	Ok(())
}
