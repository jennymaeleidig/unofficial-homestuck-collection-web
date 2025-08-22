## Webapp

Migration of the Unofficial Homestuck Collection to a pure webapp architecture.

I tried to keep the changes as minimal as possible while still achieving the desired functionality.

### Changes Made

- Streamlined settings menu.
- Disabled Mods (prebundled imods should still work)
- Removed Electron Dependency
  - Allows for compilation on m series Macs
- Commit to Ruffle as the primary Flash emulation solution.
- Dockerized
- Add simple auth server so that users can save their progress.
- Added a continue button.
- allows for near complete mobile support.
  - interactive portions or large flash animations may still have issues.
- update the asset pack to account for serverification of assets.
- Updated the jinja2 templates for better maintainability.
- Extra configuration options to env.

### Runnin

You'll need to get the new web asset pack [here]().

and then configure your environment.

```properties
# Dirs need trailing slash.
ASSET_DIR=""
ASSET_PACK_HREF=""
AUTH_SERVER_URL=""

ASSET_PACK_PORT=7413
WEB_PORT=8413
AUTH_PORT=9413
```

Then spin her up!

#### DEV

Baremetal:

```shell
make serve
```

Via Docker:

```shell
docker-compose -f docker/docker-compose.dev.yml up --build
```

#### Prod

```shell
docker-compose -f docker/docker-compose.yml up --build
```

Note: If running on docker, be sure to update the compose files with the necessary environment variables / args / volumes.

## Legal

```text
The unofficial-homestuck-collection webapp branch is not part of the unofficial-homestuck-collection project and is NOT licensed under GPL3.

Copyright (c) GiovanH, All Rights Reserved
```
