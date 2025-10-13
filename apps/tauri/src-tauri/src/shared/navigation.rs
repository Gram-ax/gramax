pub fn should_allow_navigation(url: &url::Url, allowed_domains: &[&str]) -> bool {
  url.scheme() == "blob"
    || url.scheme() == "tauri"
    || url.domain().is_some_and(|domain| allowed_domains.contains(&domain))
}
