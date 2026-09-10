#!/usr/bin/env bash
# Pasang SSH key ke VPS (sekali). Butuh password root/user VPS.
# Usage: VPS_HOST=1.2.3.4 VPS_USER=root bash deploy/install-ssh-key.sh
set -euo pipefail

: "${VPS_HOST:?Set VPS_HOST}"
: "${VPS_USER:?Set VPS_USER}"
VPS_PORT="${VPS_PORT:-22}"

PUB_KEY="${HOME}/.ssh/id_ed25519.pub"
if [[ ! -f "$PUB_KEY" ]]; then
  echo "Public key tidak ditemukan: $PUB_KEY"
  exit 1
fi

echo "Akan menambahkan key ke ${VPS_USER}@${VPS_HOST}:${VPS_PORT}"
echo "Anda diminta password VPS sekali."
ssh-copy-id -i "$PUB_KEY" -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}"
echo "SSH key terpasang. Tes: ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} 'echo ok'"
