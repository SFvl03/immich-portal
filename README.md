# Photo Portal

A tiny container that gives guests **one URL** with a tab per album, plus an
optional upload tab:

- One tab per Immich share link you configure (as many as you want)
- An optional **Add Photos** tab for a public upload/proxy link

Nothing is stored or proxied by this container itself — it's just a static
page with `<iframe>`s and a tab switcher. All actual viewing/uploading still
happens on Immich and on your proxy, in the guest's own browser.

## 1. Configure

Edit `docker-compose.yml` and set:

- `ALBUMS` — one tab per album, format `Name|share-link;Name|share-link;...`.
  Each pair is `Name|URL`; separate multiple pairs with `;`. Example:
  ```
  ALBUMS=Ceremony|https://photos.example.com/share/aaa;Reception|https://photos.example.com/share/bbb;Portraits|https://photos.example.com/share/ccc
  ```
  This gives guests three tabs. For just one album, use a single pair —
  `ALBUMS=Photos|https://photos.example.com/share/aaa`. (If you set the old
  `IMMICH_URL` instead of `ALBUMS`, the portal still works and builds one
  tab called "View & Save" from it, for backward compatibility.)
- `UPLOAD_URL` — your public proxy URL for uploads (e.g. whatever you're
  reverse-proxying — a drop-folder app, a second Immich share, etc.) If set,
  an extra "Add Photos" tab is added automatically. Omit the line entirely
  if you don't want an upload tab.
- `PORTAL_TITLE` — optional, shown in the header (default: "Photo Portal")

Names in `ALBUMS` can't contain a literal `|` or `;` (used as separators) or
a `"` character (breaks the generated JS). Anything else, including spaces
and `&`, is fine.

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
  version/config if a tab looks blank.
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
         - ALBUMS=Ceremony|https://photos.example.com/share/aaa;Reception|https://photos.example.com/share/bbb
         - UPLOAD_URL=https://upload.example.com
         - PORTAL_TITLE=Family Photo Portal
       restart: unless-stopped
   ```

## 5. Point a Cloudflare Tunnel at it

The container always listens on **port 80** internally — that's the one
container port cloudflared needs, no matter how it's run.

**On Unraid, with cloudflared as its own container** (the common Unraid
setup): give `immich-portal` a normal port mapping just like your other
apps, and point cloudflared at it by `http://<unraid-ip>:<port>` — the same
pattern you already use for every other container, not by container name
(Unraid's default networking usually doesn't resolve container names between
separately-added containers).

```yaml
services:
  immich-portal:
    image: ghcr.io/<you>/immich-portal:latest
    container_name: immich-portal
    ports:
      - "8090:80"    # pick any free host port on your Unraid box
    environment:
      - ALBUMS=Ceremony|https://photos.example.com/share/aaa
    restart: unless-stopped
```

Then in the Cloudflare Zero Trust dashboard, add a **Public Hostname** for
your tunnel with service:
```
http://192.168.1.50:8090
```
(replace `192.168.1.50` with your actual Unraid LAN IP, and `8090` with
whatever host port you chose).

**If cloudflared instead shares a custom Docker network** with your other
containers (less common outside Unraid, but sometimes used), you can skip
the host port entirely: attach `immich-portal` to that same network as
`external: true` and point the tunnel at `http://immich-portal:80` — Docker's
internal DNS resolves the container name directly. Ask if you want this
version spelled out for your setup.

**If cloudflared runs directly on the host** (not in Docker) instead,
publish the port in compose (`ports: ["8080:80"]`) and point the tunnel's
public hostname at `http://localhost:8080` instead.

## File layout

```
immich-portal/
├── .github/workflows/publish.yml   # builds & pushes image to GHCR on push to main
├── .dockerignore
├── .gitignore
├── Dockerfile
├── docker-compose.yml               # local build/testing
├── entrypoint.sh                    # injects ALBUMS/UPLOAD_URL/PORTAL_TITLE at container start
└── html/
    ├── index.html
    ├── style.css
    ├── app.js
    └── config.js.template
```

Because the config is injected at **container start** (via `envsubst`, not
baked into the image), you can change `ALBUMS` / `UPLOAD_URL` in
`docker-compose.yml` and just `docker compose up -d` again — no rebuild
needed.

I have not started or tested this container — build and run it yourself with
the command above.
