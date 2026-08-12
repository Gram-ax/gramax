#!/usr/bin/env bash
retry() {
	local max=$1 delay=$2
	shift 2
	[ "${1:-}" = "--" ] && shift
	local n=1
	until "$@"; do
		if [ "$n" -ge "$max" ]; then
			echo "retry: FAILED after ${n} attempts: $*" >&2
			return 1
		fi
		echo "retry: attempt ${n}/${max} failed: $* — retrying in ${delay}s" >&2
		sleep "$delay"
		n=$((n + 1))
		delay=$((delay * 2))
	done
}
