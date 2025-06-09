# Frontend Docker Image

This directory contains the Dockerfile used to build and serve the Angular application for production.

The image builds the Angular code from the `Frontend` directory, then serves the compiled files with Nginx. It is referenced by `docker-compose.yml` to run the production frontend.

## Unit tests

Run `npm test` to execute the Angular unit tests. Karma normally launches the system Chrome. In CI you can instead use Playwright's bundled Chromium with `--no-sandbox` or set `CHROME_BIN` to the path of that bundled executable.

```bash
npx playwright install chromium
export CHROME_BIN=$(pwd)/node_modules/playwright-core/.local-browsers/chromium-*/chrome-linux/chrome
CI=true npm test -- --watch=false --browsers=ChromeHeadless --no-sandbox
```
