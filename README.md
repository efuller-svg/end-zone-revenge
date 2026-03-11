# End Zone Revenge

Small static browser game inspired by Alabama's end-zone interception replay against Tennessee.

## Run it

Open [index.html](/Users/williamfullerlfg/Documents/New project/index.html) directly in a browser, or serve the folder:

```bash
cd /Users/williamfullerlfg/Documents/New\ project
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

If your son is on the same Wi-Fi as your Mac, he can also open:

```text
http://YOUR-MAC-IP:8000
```

Example from this machine:

```text
http://192.168.1.207:8000
```

## Controls

- Mouse or touch to move Alabama's defender
- Arrow keys or `WASD` also work
- Hold `Space` or the on-screen `BOOST` button after the throw for a speed burst

## Modes

- `Kid Mode`: target route stays highlighted
- `Rivalry Mode`: target route tips late
- `Chaos Mode`: no hint at all

## iPad setup

For the quickest test:

1. Keep the local server running on your Mac.
2. Open the local network URL on the iPad in Safari.
3. Tap `Share` -> `Add to Home Screen`.

For the best version:

- host it on HTTPS
- then `Add to Home Screen` from Safari
- the service worker will let it cache locally like a lightweight app
