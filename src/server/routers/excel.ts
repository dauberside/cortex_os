import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  generateExcelTemplate,
  exportNotesToExcel,
  importNotesFromExcel,
} from "@/lib/excel";

export const excelRouter = router({
  downloadTemplate: protectedProcedure.query(async () => {
    const buffer = await generateExcelTemplate();
    return {
      data: buffer.toString("base64"),
      filename: "notes-template.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }),

  exportNotes: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const buffer = await exportNotesToExcel(userId);
    return {
      data: buffer.toString("base64"),
      filename: `notes-export-${new Date().toISOString().split("T")[0]}.xlsx`,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }),

  importNotes: protectedProcedure
    .input(
      z.object({
        fileData: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const buffer = Buffer.from(input.fileData, "base64");
      const result = await importNotesFromExcel(userId, buffer);
      return result;
    }),
});
