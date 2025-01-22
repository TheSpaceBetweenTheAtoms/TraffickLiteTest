import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { documents, flags, sampleDocument } from "@db/schema";
import { eq } from "drizzle-orm";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { stringify } from "csv-stringify/sync";
import { parse } from "csv-parse/sync";
import PDFDocument from "pdfkit";

export function registerRoutes(app: Express): Server {
  app.get("/api/documents/:id", async (req, res) => {
    let document = await db.query.documents.findFirst({
      where: eq(documents.id, parseInt(req.params.id)),
    });

    if (!document) {
      const [newDocument] = await db
        .insert(documents)
        .values({ content: sampleDocument })
        .returning();
      document = newDocument;
    }

    if (!document) return res.status(404).json({ message: "Document not found" });
    res.json(document);
  });

  app.get("/api/documents/:id/flags", async (req, res) => {
    const documentFlags = await db.query.flags.findMany({
      where: eq(flags.documentId, parseInt(req.params.id)),
      orderBy: flags.startOffset,
    });
    res.json(documentFlags);
  });

  app.post("/api/documents/:id/flags", async (req, res) => {
    const { text, color, startOffset, endOffset } = req.body;

    // Check if this text segment overlaps with any existing flags
    const existingFlags = await db.query.flags.findMany({
      where: eq(flags.documentId, parseInt(req.params.id)),
    });

    const hasOverlap = existingFlags.some(
      flag =>
        (startOffset >= flag.startOffset && startOffset < flag.endOffset) ||
        (endOffset > flag.startOffset && endOffset <= flag.endOffset) ||
        (startOffset <= flag.startOffset && endOffset >= flag.endOffset)
    );

    if (hasOverlap) {
      return res.status(400).json({ message: "Text segment already flagged" });
    }

    const flag = await db
      .insert(flags)
      .values({
        documentId: parseInt(req.params.id),
        text,
        color,
        startOffset,
        endOffset,
      })
      .returning();
    res.json(flag[0]);
  });

  app.delete("/api/flags/:id", async (req, res) => {
    await db.delete(flags).where(eq(flags.id, parseInt(req.params.id)));
    res.status(204).end();
  });

  // New endpoint to clear all flags for a document
  app.delete("/api/documents/:id/flags", async (req, res) => {
    await db.delete(flags).where(eq(flags.documentId, parseInt(req.params.id)));
    res.status(204).end();
  });

  app.post("/api/documents/:id/import", async (req, res) => {
    const { csv } = req.body;

    try {
      const records = parse(csv, { columns: true });

      for (const record of records) {
        await db.insert(flags).values({
          documentId: parseInt(req.params.id),
          text: record.text,
          color: record.color,
          startOffset: parseInt(record.startOffset),
          endOffset: parseInt(record.endOffset),
        });
      }

      res.status(200).json({ message: "Import successful" });
    } catch (error) {
      res.status(400).json({ message: "Invalid CSV format" });
    }
  });

  app.get("/api/documents/:id/export", async (req, res) => {
    const { format } = req.query;
    const documentFlags = await db.query.flags.findMany({
      where: eq(flags.documentId, parseInt(req.params.id)),
      orderBy: flags.startOffset,
    });

    switch (format) {
      case "doc": {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [new TextRun("Flagged Text Report")],
              }),
              ...documentFlags.map(flag =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${flag.text} (${flag.color})`,
                      color: flag.color,
                    }),
                  ],
                })
              ),
            ],
          }],
        });

        const buffer = await Packer.toBuffer(doc);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", "attachment; filename=flagged-text.docx");
        res.send(buffer);
        break;
      }

      case "csv": {
        const csvData = stringify([
          ["Text", "Color", "StartOffset", "EndOffset"],
          ...documentFlags.map(flag => [
            flag.text,
            flag.color,
            flag.startOffset,
            flag.endOffset,
          ]),
        ]);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=flagged-text.csv");
        res.send(csvData);
        break;
      }

      case "pdf": {
        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=flagged-text.pdf");
        doc.pipe(res);

        doc.fontSize(16).text("Flagged Text Report", { align: "center" });
        doc.moveDown();

        documentFlags.forEach(flag => {
          doc.fontSize(12)
             .fillColor(flag.color)
             .text(flag.text)
             .moveDown();
        });

        doc.end();
        break;
      }

      default:
        res.status(400).json({ message: "Invalid export format" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}