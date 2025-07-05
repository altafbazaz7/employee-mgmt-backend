import express from "express";
import { registerRoutes } from "./routes";
import path from "path";

(async () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const server = await registerRoutes(app);

  const distPath = path.resolve(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  const port = 800;
  server.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}`);
    console.log(`👉 GraphQL at http://localhost:${port}/graphql`);
  });
})();
