#!/usr/bin/env bash
# Test Polar webhook flow locally
# Prerequisites: dev server running on localhost:3000, .env.local has POLAR_WEBHOOK_SECRET=test-webhook-secret-local
set -euo pipefail

WEBHOOK_URL="http://localhost:3000/api/polar/webhook"
SECRET="test-webhook-secret-local"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

sign_payload() {
  echo -n "$1" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //'
}

send_webhook() {
  local payload="$1"
  local sig
  sig=$(sign_payload "$payload")
  curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "polar-signature: $sig" \
    -d "$payload"
}

# --- Find a real user from the local DB ---
echo -e "${BOLD}=== Querying local DB for a test user ===${RESET}"
cd "$(dirname "$0")/.."

USER_JSON=$(npx prisma db execute --stdin <<'SQL' 2>/dev/null || true
SELECT "id", "email" FROM "User" LIMIT 1;
SQL
)

# If prisma db execute doesn't work well, try a direct query
if [ -z "$USER_JSON" ] || echo "$USER_JSON" | grep -q "error"; then
  echo "Prisma direct query didn't work, trying via node script..."
  USER_JSON=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.user.findFirst({ select: { id: true, email: true } })
      .then(u => { console.log(JSON.stringify(u)); p.\$disconnect(); })
      .catch(e => { console.error(e); p.\$disconnect(); process.exit(1); });
  ")
fi

if [ -z "$USER_JSON" ] || [ "$USER_JSON" = "null" ]; then
  echo -e "${RED}No users found in DB. Create an account first.${RESET}"
  exit 1
fi

USER_ID=$(echo "$USER_JSON" | node -e "process.stdin.on('data',d=>{const o=JSON.parse(d);console.log(o.id)})")
USER_EMAIL=$(echo "$USER_JSON" | node -e "process.stdin.on('data',d=>{const o=JSON.parse(d);console.log(o.email)})")

echo "Using user: $USER_ID ($USER_EMAIL)"
echo ""

# ============================================================
# TEST 1: Happy path — metadata.userId + metadata.plan present
# ============================================================
echo -e "${BOLD}=== TEST 1: Happy path (metadata.userId) ===${RESET}"

PAYLOAD=$(cat <<EOF
{
  "type": "subscription.activated",
  "data": {
    "id": "test-sub-001",
    "customer_id": "test-cust-001",
    "product_id": "test-prod-001",
    "status": "active",
    "current_period_end": "2026-04-20T00:00:00Z",
    "cancel_at_period_end": false,
    "metadata": {
      "userId": "$USER_ID",
      "plan": "standard"
    }
  }
}
EOF
)

RESPONSE=$(send_webhook "$PAYLOAD")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | sed 's/.*HTTP_STATUS://')
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Response: $BODY (HTTP $HTTP_CODE)"

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}PASS${RESET} — webhook accepted"
else
  echo -e "${RED}FAIL${RESET} — expected 200, got $HTTP_CODE"
fi

# Check DB
echo "Checking DB..."
DB_CHECK=$(node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.subscription.findUnique({ where: { userId: '$USER_ID' } })
    .then(s => {
      if (!s) { console.log('NO_SUB'); }
      else { console.log(JSON.stringify({ status: s.status, plan: s.plan, polarSubscriptionId: s.polarSubscriptionId })); }
      p.\$disconnect();
    })
    .catch(e => { console.error(e); p.\$disconnect(); process.exit(1); });
")
echo "Subscription: $DB_CHECK"
echo ""

# ============================================================
# TEST 2: Email fallback — no metadata.userId, has customer.email
# ============================================================
echo -e "${BOLD}=== TEST 2: Email fallback (customer.email) ===${RESET}"

# First reset the subscription to free so we can test activation again
node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.subscription.updateMany({ where: { userId: '$USER_ID' }, data: { status: 'free', plan: 'free', polarSubscriptionId: null, polarCustomerId: null } })
    .then(() => p.\$disconnect())
    .catch(e => { console.error(e); p.\$disconnect(); });
" 2>/dev/null

PAYLOAD2=$(cat <<EOF
{
  "type": "subscription.activated",
  "data": {
    "id": "test-sub-002",
    "customer_id": "test-cust-002",
    "product_id": "test-prod-001",
    "status": "active",
    "current_period_end": "2026-04-20T00:00:00Z",
    "cancel_at_period_end": false,
    "metadata": {
      "plan": "standard"
    },
    "customer": {
      "email": "$USER_EMAIL"
    }
  }
}
EOF
)

RESPONSE2=$(send_webhook "$PAYLOAD2")
HTTP_CODE2=$(echo "$RESPONSE2" | grep "HTTP_STATUS:" | sed 's/.*HTTP_STATUS://')
BODY2=$(echo "$RESPONSE2" | grep -v "HTTP_STATUS:")

echo "Response: $BODY2 (HTTP $HTTP_CODE2)"

if [ "$HTTP_CODE2" = "200" ]; then
  echo -e "${GREEN}PASS${RESET} — email fallback worked"
else
  echo -e "${RED}FAIL${RESET} — expected 200, got $HTTP_CODE2"
fi

# Check DB again
DB_CHECK2=$(node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.subscription.findUnique({ where: { userId: '$USER_ID' } })
    .then(s => {
      if (!s) { console.log('NO_SUB'); }
      else { console.log(JSON.stringify({ status: s.status, plan: s.plan, polarSubscriptionId: s.polarSubscriptionId })); }
      p.\$disconnect();
    })
    .catch(e => { console.error(e); p.\$disconnect(); process.exit(1); });
")
echo "Subscription: $DB_CHECK2"
echo ""

# ============================================================
# TEST 3: Failure path — no userId, no email → 400
# ============================================================
echo -e "${BOLD}=== TEST 3: Missing userId and email → 400 ===${RESET}"

PAYLOAD3=$(cat <<EOF
{
  "type": "subscription.activated",
  "data": {
    "id": "test-sub-003",
    "customer_id": "test-cust-003",
    "product_id": "test-prod-001",
    "status": "active",
    "current_period_end": "2026-04-20T00:00:00Z",
    "cancel_at_period_end": false,
    "metadata": {}
  }
}
EOF
)

RESPONSE3=$(send_webhook "$PAYLOAD3")
HTTP_CODE3=$(echo "$RESPONSE3" | grep "HTTP_STATUS:" | sed 's/.*HTTP_STATUS://')
BODY3=$(echo "$RESPONSE3" | grep -v "HTTP_STATUS:")

echo "Response: $BODY3 (HTTP $HTTP_CODE3)"

if [ "$HTTP_CODE3" = "400" ]; then
  echo -e "${GREEN}PASS${RESET} — correctly rejected with 400"
else
  echo -e "${RED}FAIL${RESET} — expected 400, got $HTTP_CODE3"
fi
echo ""

# ============================================================
# TEST 4: Invalid signature → 401
# ============================================================
echo -e "${BOLD}=== TEST 4: Invalid signature → 401 ===${RESET}"

PAYLOAD4='{"type":"subscription.activated","data":{"id":"x","customer_id":"x","product_id":"x","status":"active","current_period_end":"2026-04-20T00:00:00Z","cancel_at_period_end":false,"metadata":{"userId":"x","plan":"standard"}}}'

RESPONSE4=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "polar-signature: bad-signature" \
  -d "$PAYLOAD4")
HTTP_CODE4=$(echo "$RESPONSE4" | grep "HTTP_STATUS:" | sed 's/.*HTTP_STATUS://')
BODY4=$(echo "$RESPONSE4" | grep -v "HTTP_STATUS:")

echo "Response: $BODY4 (HTTP $HTTP_CODE4)"

if [ "$HTTP_CODE4" = "401" ]; then
  echo -e "${GREEN}PASS${RESET} — correctly rejected invalid signature"
else
  echo -e "${RED}FAIL${RESET} — expected 401, got $HTTP_CODE4"
fi
echo ""

# ============================================================
# Cleanup: reset subscription back to free
# ============================================================
echo -e "${BOLD}=== Cleanup: resetting subscription to free ===${RESET}"
node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.subscription.updateMany({ where: { userId: '$USER_ID' }, data: { status: 'free', plan: 'free', polarSubscriptionId: null, polarCustomerId: null } })
    .then(r => { console.log('Reset', r.count, 'subscription(s)'); p.\$disconnect(); })
    .catch(e => { console.error(e); p.\$disconnect(); });
"

echo ""
echo -e "${BOLD}=== All tests complete ===${RESET}"
