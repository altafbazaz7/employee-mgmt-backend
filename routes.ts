// @ts-nocheck
import type { Express } from "express";
import { createServer, type Server } from "http";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { verifyToken, generateToken } from "./utils/jwt";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const user = token ? verifyToken(token) : null;
      return { user };
    },
    introspection: true,
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  // REST endpoints for authentication (fallback)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user);
      res.json({ token, user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        username,
        email,
        password,
        role: role || "employee",
      });

      const token = generateToken(user);
      res.json({ token, user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
