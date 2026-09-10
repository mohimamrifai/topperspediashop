#!/usr/bin/env bash
# Seed akun admin via tunnel DB (jalan dari mesin lokal).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

: "${VPS_HOST:?Set VPS_HOST}"
: "${VPS_USER:?Set VPS_USER}"
VPS_PORT="${VPS_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/opt/topperspediashop}"

ssh -f -N -L 15432:127.0.0.1:5432 -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}"
sleep 2
REMOTE_DB_URL="$(ssh -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}" "grep ^DATABASE_URL= ${REMOTE_DIR}/.env | cut -d= -f2- | tr -d '\"'")"
export DATABASE_URL="postgresql://topperspediashop:$(echo "$REMOTE_DB_URL" | sed -n 's|.*://topperspediashop:\([^@]*\)@.*|\1|p')@127.0.0.1:15432/topperspediashop"
pnpm db:seed
pkill -f "ssh -p ${VPS_PORT}.*15432:127.0.0.1:5432" 2>/dev/null || true
echo "Seed selesai."
