#!/bin/zsh

cd "/Users/williamfullerlfg/Documents/New project" || exit 1

IP_ADDRESS=$(python3 - <<'PY'
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    s.connect(("8.8.8.8", 80))
    print(s.getsockname()[0])
finally:
    s.close()
PY
)

PORT=""

for CANDIDATE in 8000 8001 8002 8003 8004 8005; do
  if ! lsof -ti tcp:"${CANDIDATE}" >/dev/null 2>&1; then
    PORT="${CANDIDATE}"
    break
  fi
done

if [ -z "${PORT}" ]; then
  echo "No free port found between 8000 and 8005."
  exit 1
fi

echo ""
echo "End Zone Revenge is available on your Wi-Fi at:"
echo "http://${IP_ADDRESS}:${PORT}"
echo ""
echo "Keep this window open while your son plays on the iPad."
echo ""

open "http://127.0.0.1:${PORT}"

python3 -m http.server "${PORT}" --bind 0.0.0.0
