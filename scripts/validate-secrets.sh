#!/usr/bin/env bash
# Verify the offis-secrets Secret in the target namespace is fully populated
# before allowing rollout. Catches the common failure mode of `kubectl apply`-ing
# secrets.example.yaml with REPLACE placeholders still in place.
#
# Usage:
#   NAMESPACE=offisdesign SECRET=offis-secrets ./scripts/validate-secrets.sh
#
# Exit 0 if all required keys are present, non-empty, and not placeholders.
# Exit 1 otherwise. Designed to be the gate immediately before `kubectl rollout`.

set -euo pipefail

NAMESPACE="${NAMESPACE:-offisdesign}"
SECRET="${SECRET:-offis-secrets}"

REQUIRED_KEYS=(
  DATABASE_URL
  REDIS_URL
  JWT_ACCESS_SECRET
  JWT_REFRESH_SECRET
  COOKIE_DOMAIN
  API_PUBLIC_URL
  WEB_PUBLIC_URL
  ADMIN_PUBLIC_URL
)

# Conditional sets — only enforced when their toggle key is present.
S3_KEYS=(S3_BUCKET S3_REGION S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY)
STRIPE_KEYS=(STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET)
SMTP_KEYS=(SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASSWORD)

MIN_LEN_BY_KEY_PREFIX_JWT=32
PLACEHOLDER_PATTERN='^(REPLACE|CHANGE_?ME|TODO|XXX|<.*>)$'

if ! command -v kubectl >/dev/null 2>&1; then
  echo "ERROR: kubectl not found in PATH" >&2
  exit 1
fi

if ! kubectl -n "$NAMESPACE" get secret "$SECRET" >/dev/null 2>&1; then
  echo "ERROR: Secret $SECRET not found in namespace $NAMESPACE" >&2
  exit 1
fi

errors=0

check_key() {
  local key="$1"
  local min_len="${2:-1}"
  local value
  value=$(kubectl -n "$NAMESPACE" get secret "$SECRET" \
    -o jsonpath="{.data.${key}}" 2>/dev/null | base64 -d 2>/dev/null || true)

  if [[ -z "$value" ]]; then
    echo "  ✗ $key is missing or empty"
    errors=$((errors + 1))
    return
  fi
  if [[ "$value" =~ $PLACEHOLDER_PATTERN ]]; then
    echo "  ✗ $key still holds a placeholder value ('$value')"
    errors=$((errors + 1))
    return
  fi
  if [[ ${#value} -lt $min_len ]]; then
    echo "  ✗ $key is shorter than required minimum ($min_len chars)"
    errors=$((errors + 1))
    return
  fi
  echo "  ✓ $key"
}

get_key() {
  kubectl -n "$NAMESPACE" get secret "$SECRET" \
    -o jsonpath="{.data.$1}" 2>/dev/null | base64 -d 2>/dev/null || true
}

echo "Validating secret $NAMESPACE/$SECRET"
echo "Required keys:"
for k in "${REQUIRED_KEYS[@]}"; do
  if [[ "$k" == JWT_*_SECRET ]]; then
    check_key "$k" "$MIN_LEN_BY_KEY_PREFIX_JWT"
  else
    check_key "$k"
  fi
done

storage_driver=$(get_key STORAGE_DRIVER)
if [[ "$storage_driver" == "s3" ]]; then
  echo "STORAGE_DRIVER=s3 — checking S3 keys:"
  for k in "${S3_KEYS[@]}"; do check_key "$k"; done
fi

payment_provider=$(get_key PAYMENT_PROVIDER)
if [[ "$payment_provider" == "stripe" ]]; then
  echo "PAYMENT_PROVIDER=stripe — checking Stripe keys:"
  for k in "${STRIPE_KEYS[@]}"; do check_key "$k"; done
fi

email_transport=$(get_key EMAIL_TRANSPORT)
if [[ "$email_transport" == "smtp" ]]; then
  echo "EMAIL_TRANSPORT=smtp — checking SMTP keys:"
  for k in "${SMTP_KEYS[@]}"; do check_key "$k"; done
fi

if [[ $errors -gt 0 ]]; then
  echo ""
  echo "FAIL: $errors secret(s) missing, empty, or placeholder. Refusing to roll out." >&2
  exit 1
fi

echo ""
echo "OK: all required secrets present."
