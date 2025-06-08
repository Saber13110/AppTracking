# Frontend Docker Image

This directory contains the Dockerfile used to build and serve the Angular application for production.

The image builds the Angular code from the `Frontend` directory, then serves the compiled files with Nginx. It is referenced by `docker-compose.yml` to run the production frontend.
