import ExcelJS from "exceljs";
import { prisma } from "./prisma";

export interface NoteImportData {
  title: string;
  content: string;
  tags?: string;
  linkedNotes?: string;
}

export interface NoteExportData {
  id: string;
  title: string;
  content: string;
  tags: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function generateExcelTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Notes");

  worksheet.columns = [
    { header: "Title", key: "title", width: 30 },
    { header: "Content", key: "content", width: 50 },
    { header: "Tags (comma-separated)", key: "tags", width: 30 },
    { header: "Linked Notes (comma-separated titles)", key: "linkedNotes", width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  worksheet.addRow({
    title: "Example Note",
    content: "This is an example note content",
    tags: "example, sample",
    linkedNotes: "Related Note Title",
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function exportNotesToExcel(
  userId: string
): Promise<Buffer> {
  const notes = await prisma.note.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    include: {
      noteTags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Notes");

  worksheet.columns = [
    { header: "ID", key: "id", width: 30 },
    { header: "Title", key: "title", width: 30 },
    { header: "Content", key: "content", width: 50 },
    { header: "Tags", key: "tags", width: 30 },
    { header: "Created At", key: "createdAt", width: 20 },
    { header: "Updated At", key: "updatedAt", width: 20 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4A90E2" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  notes.forEach((note) => {
    const tags = note.noteTags.map((nt) => nt.tag.name).join(", ");
    worksheet.addRow({
      id: note.id,
      title: note.title,
      content: note.content,
      tags,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function importNotesFromExcel(
  userId: string,
  fileBuffer: Buffer
): Promise<{ success: number; errors: string[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer as any);

  const worksheet = workbook.getWorksheet("Notes");
  if (!worksheet) {
    throw new Error("Worksheet 'Notes' not found in the Excel file");
  }

  const errors: string[] = [];
  let success = 0;

  const rows: NoteImportData[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const title = row.getCell(1).value?.toString() || "";
    const content = row.getCell(2).value?.toString() || "";
    const tags = row.getCell(3).value?.toString() || "";
    const linkedNotes = row.getCell(4).value?.toString() || "";

    if (!title || !content) {
      errors.push(`Row ${rowNumber}: Title and Content are required`);
      return;
    }

    rows.push({ title, content, tags, linkedNotes });
  });

  const noteMap = new Map<string, string>();

  for (let i = 0; i < rows.length; i++) {
    const rowData = rows[i];
    const rowNumber = i + 2;

    try {
      const note = await prisma.note.create({
        data: {
          userId,
          title: rowData.title,
          content: rowData.content,
          sortOrder: i,
        },
      });

      noteMap.set(rowData.title, note.id);

      if (rowData.tags) {
        const tagNames = rowData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        for (const tagName of tagNames) {
          const tag = await prisma.tag.upsert({
            where: {
              userId_name: {
                userId,
                name: tagName,
              },
            },
            create: {
              userId,
              name: tagName,
            },
            update: {},
          });

          await prisma.noteTag.create({
            data: {
              noteId: note.id,
              tagId: tag.id,
            },
          });
        }
      }

      success++;
    } catch (error) {
      errors.push(
        `Row ${rowNumber}: Failed to import note - ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const rowData = rows[i];
    const noteId = noteMap.get(rowData.title);

    if (!noteId || !rowData.linkedNotes) continue;

    const linkedTitles = rowData.linkedNotes
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    for (const linkedTitle of linkedTitles) {
      const linkedNoteId = noteMap.get(linkedTitle);
      if (linkedNoteId && linkedNoteId !== noteId) {
        try {
          await prisma.link.create({
            data: {
              userId,
              fromNoteId: noteId,
              toNoteId: linkedNoteId,
            },
          });
        } catch (error) {
          // リンク作成エラーは警告として扱う（重複などの可能性）
        }
      }
    }
  }

  return { success, errors };
}
