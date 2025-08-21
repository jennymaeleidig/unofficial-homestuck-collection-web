## Webapp

Migration of the Unofficial Homestuck Collection to a pure webapp architecture.

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

## Legal

```text
The unofficial-homestuck-collection webapp branch is not part of the unofficial-homestuck-collection project and is NOT licensed under GPL3.

Copyright (c) GiovanH, All Rights Reserved
```
