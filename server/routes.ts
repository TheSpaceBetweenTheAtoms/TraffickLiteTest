import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { documents, flags } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  app.get("/api/documents/:id", async (req, res) => {
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, parseInt(req.params.id)),
    });
    if (!document) return res.status(404).json({ message: "Document not found" });
    res.json(document);
  });

  app.get("/api/documents/:id/flags", async (req, res) => {
    const documentFlags = await db.query.flags.findMany({
      where: eq(flags.documentId, parseInt(req.params.id)),
    });
    res.json(documentFlags);
  });

  app.post("/api/documents/:id/flags", async (req, res) => {
    const { text, color, startOffset, endOffset } = req.body;
    const flag = await db.insert(flags).values({
      documentId: parseInt(req.params.id),
      text,
      color,
      startOffset,
      endOffset,
    }).returning();
    res.json(flag[0]);
  });

  app.delete("/api/flags/:id", async (req, res) => {
    await db.delete(flags).where(eq(flags.id, parseInt(req.params.id)));
    res.status(204).end();
  });

  const httpServer = createServer(app);
  return httpServer;
}
