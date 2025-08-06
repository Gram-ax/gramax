use std::sync::Arc;

use axum::extract::Path;
use axum::extract::Request;
use axum::extract::State;
use axum::middleware::Next;
use axum::response::Response;
use axum_client_ip::XRealIp;
use axum_extra::extract::CookieJar;

use crate::metrics::doc::MetricDocBuilder;
use crate::metrics::doc::UserAction;
use crate::metrics::doc::UserId;
use crate::metrics::doc::UserMetadata;
use crate::metrics::exporter::MetricExporter;
use crate::metrics::exporter::MetricSender;

use crate::updater::Bucket;
use crate::updater::Platform;

use tracing::*;

#[derive(Clone)]
pub struct Metrics {
  pub cookie_domain: Arc<Option<String>>,
  pub sender: MetricSender,
}

pub async fn static_assets_metrics(
  State(metrics): State<Metrics>,
  XRealIp(ip): XRealIp,
  jar: CookieJar,
  req: Request,
  next: Next,
) -> (CookieJar, Response) {
  let Some(id) = UserId::from_jar(&jar) else {
    debug!("no user id found in cookie; skip collecting metrics");
    let res = next.run(req).await;
    let jar = UserId::gen().set_cookie(metrics.cookie_domain.as_deref().map(String::from), jar);
    return (jar, res);
  };

  let headers = req.headers();
  let ver = headers.get("x-app-version").and_then(|v| v.to_str().ok()).map(String::from);
  let user_agent = headers.get("user-agent").and_then(|v| v.to_str().ok()).map(String::from);

  let doc = MetricDocBuilder::user(id)
    .with_action(UserAction::GetAssets)
    .with_ip(ip)
    .with_parse_user_agent(user_agent)
    .with_app_version(ver)
    .build();

  if let Err(e) = metrics.sender.send(doc).await {
    error!("failed to send metrics: {:#?}", e);
  }

  let response = next.run(req).await;
  (jar, response)
}

pub async fn updater_metrics(
  State(metrics): State<Metrics>,
  XRealIp(ip): XRealIp,
  jar: CookieJar,
  req: Request,
  next: Next,
) -> (CookieJar, Response) {
  let action = req.extensions().get::<UserAction>().cloned().unwrap_or(UserAction::Unknown);

  let headers = req.headers();

  let ver = headers.get("x-app-version").and_then(|v| v.to_str().ok()).map(String::from);
  let os = headers.get("x-gx-os").and_then(|v| v.to_str().ok()).map(String::from);
  let platform = headers.get("x-gx-platform").and_then(|v| v.to_str().ok()).map(String::from);
  let device = headers.get("x-gx-device").and_then(|v| v.to_str().ok()).map(String::from);
  let user_id = headers.get("x-gx-uniq-id").and_then(|v| v.to_str().ok()).map(String::from);
  let user_agent = headers.get("user-agent").and_then(|v| v.to_str().ok()).map(String::from);

  let doc = match user_id {
    Some(id) => MetricDocBuilder::user(UserId(id))
      .with_metadata(UserMetadata {
        os,
        os_version: None,
        browser: None,
        browser_version: None,
        platform,
        device,
      })
      .with_user_agent(user_agent.clone()),
    None => {
      let Some(id) = UserId::from_jar(&jar) else {
        debug!("no user id found in cookie; skip collecting metrics");
        let response = next.run(req).await;
        let jar = UserId::gen().set_cookie(metrics.cookie_domain.as_deref().map(String::from), jar);
        return (jar, response);
      };

      MetricDocBuilder::user(id)
    }
  };

  let doc = doc.with_ip(ip).with_parse_user_agent(user_agent).with_app_version(ver).with_action(action);

  if let Err(e) = metrics.sender.send(doc.build()).await {
    error!("failed to send metrics: {:#?}", e);
  }

  (jar, next.run(req).await)
}

pub async fn insert_metrics_user_action_update_check(mut req: Request, next: Next) -> Response {
  req.extensions_mut().insert(UserAction::CheckUpdate);
  next.run(req).await
}

pub async fn insert_metrics_user_action_download(
  Path((bucket, platform)): Path<(Bucket, Platform)>,
  mut req: Request,
  next: Next,
) -> Response {
  let action = match bucket {
    Bucket::Updates => UserAction::DownloadUpdate { platform, bucket },
    Bucket::Releases => UserAction::DownloadRelease { platform, bucket },
  };

  req.extensions_mut().insert(action);
  next.run(req).await
}
