# Photo Portal

A tiny container that gives guests **one URL** with two tabs:

- **View & Save** — your Immich share link, embedded
- **Add Photos** — your public upload/proxy link, embedded

Nothing is stored or proxied by this container itself — it's just a static
page with two `<iframe>`s and a tab switcher. All actual viewing/uploading
still happens on Immich and on your proxy, in the guest's own browser.

## 1. Configure

Edit `docker-compose.yml` and set:

- `IMMICH_URL` — the public share link Immich gives you (Album → Share →
  Create link). If you want guests to be able to upload *into* that same
  album, enable "Allow public user to upload" on the share link.
- `UPLOAD_URL` — your public proxy URL for uploads (e.g. whatever you're
  reverse-proxying — a drop-folder app, a second Immich share, etc.)
- `PORTAL_TITLE` — optional, shown in the header (default: "Photo Portal")

## 2. Build & run

```bash
docker compose up -d --build
```

The portal listens on port **8080** by default (change the `ports:` mapping
in `docker-compose.yml` if you want a different host port). Put it behind
your existing reverse proxy / public URL the same way you already expose
Immich, and hand guests that one link.

## 3. Important caveat: some pages refuse to be framed

Iframes only work if the embedded site allows it. Many apps send an
`X-Frame-Options` or `Content-Security-Policy: frame-ancestors` header that
blocks being shown inside another page — you'll just see a blank pane if
that happens, with no error your browser will show you cleanly.

- Immich's own share pages generally allow framing, but check your specific
  version/config if the "View & Save" tab looks blank.
- Whatever you're using for the public upload proxy needs to explicitly
  **not** send a blocking `X-Frame-Options`/CSP header, or needs to allow
  your portal's origin in `frame-ancestors`.

As a safety net, each tab has a small "open directly ↗" link underneath the
iframe, so guests always have a working fallback even if the embed fails.

## 4. Push to GitHub and use the built image in your own compose

This repo includes `.github/workflows/publish.yml`, which builds the image
and pushes it to the **GitHub Container Registry (GHCR)** on every push to
`main` (and on version tags like `v1.0.0`).

1. Create a repo on GitHub and push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/immich-portal.git
   git push -u origin main
   ```
2. The workflow runs automatically (check the **Actions** tab). It publishes
   to `ghcr.io/<you>/immich-portal:latest` (repo name must be lowercase —
   GHCR requires it).
3. By default GHCR packages are **private**. Either:
   - Go to your GitHub profile → **Packages** → `immich-portal` → Package
     settings → change visibility to **Public**, or
   - Keep it private and run `docker login ghcr.io` (with a PAT that has
     `read:packages`) on whatever host will pull the image.
4. In your *other* compose file, reference the built image instead of
   building from source:
   ```yaml
   services:
     immich-portal:
       image: ghcr.io/<you>/immich-portal:latest
       container_name: immich-portal
       environment:
         - IMMICH_URL=https://photos.example.com/share/xxxxxxxx-xxxx
         - UPLOAD_URL=https://upload.example.com
         - PORTAL_TITLE=Family Photo Portal
       restart: unless-stopped
   ```
   No `ports:` needed here if a Cloudflare Tunnel container on the same
   Docker network is reaching it directly (see below) — add `ports:` only if
   something on the host itself needs to reach it too.

## 5. Point a Cloudflare Tunnel at it

**If `cloudflared` runs as a container** (most common in a compose stack),
put it on the same Docker network as `immich-portal` and skip publishing any
host port — containers can reach each other by service name:

```yaml
services:
  immich-portal:
    image: ghcr.io/<you>/immich-portal:latest
    container_name: immich-portal
    environment:
      - IMMICH_URL=https://photos.example.com/share/xxxxxxxx-xxxx
      - UPLOAD_URL=https://upload.example.com
    networks: [tunnel-net]
    restart: unless-stopped

  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=<your-tunnel-token>
    networks: [tunnel-net]
    restart: unless-stopped

networks:
  tunnel-net:
```

Then in the Cloudflare Zero Trust dashboard, under your tunnel's **Public
Hostname**, set the service to:

```
http://immich-portal:80
```

(`immich-portal` resolves via Docker's internal DNS since both containers
share `tunnel-net`; port `80` is nginx inside the container — this is the
"one container port" the tunnel needs.)

**If `cloudflared` runs on the host** (not in Docker) instead, publish the
port in compose (`ports: ["8080:80"]`) and point the tunnel's public
hostname at `http://localhost:8080` instead.

## File layout

```
immich-portal/
├── .github/workflows/publish.yml   # builds & pushes image to GHCR on push to main
├── .dockerignore
├── .gitignore
├── Dockerfile
├── docker-compose.yml               # local build/testing
├── entrypoint.sh                    # injects IMMICH_URL/UPLOAD_URL/PORTAL_TITLE at container start
└── html/
    ├── index.html
    ├── style.css
    ├── app.js
    └── config.js.template
```

Because the URLs are injected at **container start** (via `envsubst`, not
baked into the image), you can change `IMMICH_URL` / `UPLOAD_URL` in
`docker-compose.yml` and just `docker compose up -d` again — no rebuild
needed.

I have not started or tested this container — build and run it yourself with
the command above.
