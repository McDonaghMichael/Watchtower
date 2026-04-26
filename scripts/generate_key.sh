!/bin/bash
# Generates an Ed25519 SSH key pair for use with Watchtower.
# The private key goes into the Watchtower "Add Server" form.
# The public key must be added to the target server's ~/.ssh/authorized_keys.

set -e

KEY_NAME="${1:-watchtower_key}"
KEY_PATH="/tmp/${KEY_NAME}"

if [[ -f "$KEY_PATH" ]]; then
    rm -f "$KEY_PATH" "${KEY_PATH}.pub"
fi

ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "watchtower" -q

echo ""
echo "=== PRIVATE KEY (paste into Watchtower 'SSH Private Key' field) ==="
cat "$KEY_PATH"

echo ""
echo "=== PUBLIC KEY (add to target server's ~/.ssh/authorized_keys) ==="
cat "${KEY_PATH}.pub"
