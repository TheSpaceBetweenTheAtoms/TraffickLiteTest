import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { documents, flags } from "@db/schema";
import { eq } from "drizzle-orm";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { stringify } from "csv-stringify/sync";
import PDFDocument from "pdfkit";

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

  app.get("/api/documents/:id/export", async (req, res) => {
    const { format } = req.query;
    const documentFlags = await db.query.flags.findMany({
      where: eq(flags.documentId, parseInt(req.params.id)),
      orderBy: flags.createdAt,
    });

    switch (format) {
      case 'doc': {
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
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=flagged-text.docx');
        res.send(buffer);
        break;
      }

      case 'csv': {
        const csvData = stringify([
          ['Text', 'Color', 'Created At'],
          ...documentFlags.map(flag => [
            flag.text,
            flag.color,
            new Date(flag.createdAt).toLocaleString(),
          ]),
        ]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=flagged-text.csv');
        res.send(csvData);
        break;
      }

      case 'pdf': {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=flagged-text.pdf');
        doc.pipe(res);

        doc.fontSize(16).text('Flagged Text Report', { align: 'center' });
        doc.moveDown();

        documentFlags.forEach(flag => {
          doc.fontSize(12)
             .fillColor(flag.color)
             .text(flag.text)
             .fillColor('black')
             .fontSize(10)
             .text(`Created: ${new Date(flag.createdAt).toLocaleString()}`)
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