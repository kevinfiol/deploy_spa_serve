# deploy_spa_serve

A simple file server for Deno Deploy that supports single-page applications. Its only dependencies are on the Deno standard library.

`deploy_spa_serve` avoids filesystem checks on every request (expensive), and instead walks through your project directory on startup and keeps a cache of filepaths (thank you [sirv](https://github.com/lukeed/sirv) for this idea).

## Usage

You'll need to have the [Deno Deploy CLI](https://github.com/denoland/deployctl) installed on your system or CI.

Then from the root of your static site folder, run the command:
```bash
deployctl deploy --project="$PROJECT_NAME" https://deno.land/x/deploy_spa_serve/mod.ts
```

### Environment Variables

From `https://dash.deno.com/projects/[YOUR_PROJECT_NAME]/settings`, you can set the following environment variables.

#### `SPA_FALLBACK`
Optional. You must set this to enable single-page application support, otherwise, the server will treat every route as a file. Using `/` or `/index.html` will set the fallback to the root `index.html` file in your project.

#### `SPA_GLOBS`
Optional comma-delimited value for when you'd like to route filetype-like paths to your single-page application instead of the filesystem. By default, routes such as `/tricky/route/foo.hi` will assume it's a file and route to the filesystem, which may not be what you want. In this case, you can set `SPA_GLOBS="**/tricky/route/*.hi"` to forward these routes to the single-page application.

#### `IGNORE_GLOBS`
Optional comma-delimited value of globs to mark files you'd like to ignore for upload. Currently, the following are already ignored for you:
```
**/.git/**/*
**/.git
**/.env
**/.gitignore
**/.DS_Store
**/node_modules
**/node_modules/**/*
```
