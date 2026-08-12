#!/usr/bin/env bash

set +e

log() {
	printf '%s\n' "ci-duration-metrics: $*"
}

debug_enabled() {
	case "${CI_JOB_DURATION_METRICS_DEBUG:-}" in
		1 | true | TRUE | yes | YES | on | ON)
			return 0
			;;
	esac

	return 1
}

debug() {
	if debug_enabled; then
		log "debug: $*"
	fi
}

redact_url() {
	printf '%s' "$1" | sed -E 's#(https?://)[^/@]+@#\1***@#'
}

finish_successfully() {
	exit 0
}

debug "started for project=${CI_PROJECT_PATH:-${CI_PROJECT_NAME:-unknown}} ref=${CI_COMMIT_REF_NAME:-unknown} job_name=${CI_JOB_NAME:-unknown}"

if [ -z "${CI_JOB_MAX_DURATION:-}" ]; then
	debug "CI_JOB_MAX_DURATION is not set; job is not monitored"
	finish_successfully
fi

case "$CI_JOB_MAX_DURATION" in
	*[!0-9]* | 0 | "")
		log "CI_JOB_MAX_DURATION must be a positive integer in seconds; skipping metrics push"
		finish_successfully
		;;
esac
debug "CI_JOB_MAX_DURATION=$CI_JOB_MAX_DURATION"

if [ -z "${PUSHGATEWAY_URL:-}" ]; then
	log "PUSHGATEWAY_URL is not set; skipping metrics push"
	finish_successfully
fi
debug "PUSHGATEWAY_URL=$(redact_url "$PUSHGATEWAY_URL")"

if ! command -v curl >/dev/null 2>&1; then
	log "curl is not available; skipping metrics push"
	finish_successfully
fi
debug "curl=$(command -v curl)"

if ! command -v base64 >/dev/null 2>&1; then
	log "base64 is not available; skipping metrics push"
	finish_successfully
fi
debug "base64=$(command -v base64)"

if [ -z "${CI_JOB_STARTED_AT:-}" ]; then
	log "CI_JOB_STARTED_AT is not set; skipping metrics push"
	finish_successfully
fi
debug "CI_JOB_STARTED_AT=$CI_JOB_STARTED_AT"

epoch_seconds() {
	value="$1"

	if date -d "$value" +%s >/dev/null 2>&1; then
		date -d "$value" +%s
		return
	fi

	if date -j -f "%Y-%m-%dT%H:%M:%S%z" "$value" +%s >/dev/null 2>&1; then
		date -j -f "%Y-%m-%dT%H:%M:%S%z" "$value" +%s
		return
	fi

	normalized_value="$(printf '%s' "$value" | sed -E 's/\.[0-9]+//; s/Z$/+0000/; s/([+-][0-9]{2}):([0-9]{2})$/\1\2/')"
	if date -j -f "%Y-%m-%dT%H:%M:%S%z" "$normalized_value" +%s >/dev/null 2>&1; then
		date -j -f "%Y-%m-%dT%H:%M:%S%z" "$normalized_value" +%s
		return
	fi

	return 1
}

urlsafe_base64() {
	printf '%s' "$1" | base64 | tr -d '\n' | tr '+/' '-_' | sed 's/=*$//'
}

metric_label_escape() {
	printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\n/\\n/g'
}

started_at="$(epoch_seconds "$CI_JOB_STARTED_AT")"
if [ -z "$started_at" ]; then
	log "failed to parse CI_JOB_STARTED_AT=$CI_JOB_STARTED_AT; skipping metrics push"
	finish_successfully
fi
debug "started_at_epoch=$started_at"

now="$(date +%s)"
duration=$((now - started_at))
if [ "$duration" -lt 0 ]; then
	log "calculated negative duration; skipping metrics push"
	finish_successfully
fi
debug "now_epoch=$now duration_seconds=$duration"

exceeded=0
if [ "$duration" -gt "$CI_JOB_MAX_DURATION" ]; then
	exceeded=1
fi
debug "duration_exceeded=$exceeded"

project="${CI_PROJECT_PATH:-${CI_PROJECT_NAME:-unknown}}"
ref="${CI_COMMIT_REF_NAME:-unknown}"
job_name="${CI_JOB_NAME:-unknown}"

labels="project=\"$(metric_label_escape "$project")\",ref=\"$(metric_label_escape "$ref")\",job_name=\"$(metric_label_escape "$job_name")\""
metrics="$(cat <<EOF
# HELP gitlab_ci_job_duration_seconds Actual GitLab CI job duration in seconds.
# TYPE gitlab_ci_job_duration_seconds gauge
gitlab_ci_job_duration_seconds{$labels} $duration
# HELP gitlab_ci_job_max_duration_seconds Configured GitLab CI job duration limit in seconds.
# TYPE gitlab_ci_job_max_duration_seconds gauge
gitlab_ci_job_max_duration_seconds{$labels} $CI_JOB_MAX_DURATION
# HELP gitlab_ci_job_duration_exceeded Whether GitLab CI job duration exceeded the configured limit.
# TYPE gitlab_ci_job_duration_exceeded gauge
gitlab_ci_job_duration_exceeded{$labels} $exceeded
EOF
)"

pushgateway_url="${PUSHGATEWAY_URL%/}"
push_url="$pushgateway_url/metrics/job/gitlab_ci_job_duration/project@base64/$(urlsafe_base64 "$project")/ref@base64/$(urlsafe_base64 "$ref")/job_name@base64/$(urlsafe_base64 "$job_name")"
debug "push_url=$(redact_url "$push_url")"

curl_args=(-fsS --max-time "${PUSHGATEWAY_TIMEOUT_SECONDS:-10}" --data-binary @-)
if [ -n "${PUSHGATEWAY_USERNAME:-}" ] || [ -n "${PUSHGATEWAY_PASSWORD:-}" ]; then
	curl_args=(-u "${PUSHGATEWAY_USERNAME:-}:${PUSHGATEWAY_PASSWORD:-}" "${curl_args[@]}")
	debug "basic auth is configured"
fi

if debug_enabled; then
	curl_output="$(printf '%s\n' "$metrics" | curl "${curl_args[@]}" "$push_url" 2>&1)"
	curl_exit_code=$?
	if [ "$curl_exit_code" -ne 0 ]; then
		log "failed to push metrics to Pushgateway; ignoring"
		debug "curl exit code=$curl_exit_code output=$curl_output"
	else
		debug "metrics pushed successfully"
	fi
else
	if ! printf '%s\n' "$metrics" | curl "${curl_args[@]}" "$push_url" >/dev/null 2>&1; then
		log "failed to push metrics to Pushgateway; ignoring"
	fi
fi

finish_successfully
