import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In Lambda: __dirname = /var/task/dist/infra/frontend, public is at /var/task/public
  // In local dev: __dirname = packages/server/src/infra/frontend, public is at packages/server/src/infra/frontend/public
  // Try local path first (for development)
  const localPath = path.resolve(__dirname, "public");
  // Try Lambda path (process.cwd() is /var/task in Lambda)
  const lambdaPath = path.join(process.cwd(), "public");
  
  let publicPath: string;
  if (fs.existsSync(localPath)) {
    publicPath = localPath;
  } else if (fs.existsSync(lambdaPath)) {
    publicPath = lambdaPath;
  } else {
    throw new Error(
      `Could not find the build directory. Tried: ${localPath} and ${lambdaPath}. Make sure to build the client first`,
    );
  }

  app.use(express.static(publicPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}