import { router } from "../trpc";
import { noteRouter } from "./note";
import { tagRouter } from "./tag";
import { linkRouter } from "./link";
import { aiRouter } from "./ai";
import { excelRouter } from "./excel";
import { incidentRouter } from "./incident";
import { eventRouter } from "./event";
import { roleRouter } from "./role";
import { actionItemRouter } from "./actionItem";
// 福祉システム用ルーター
import { recipientRouter } from "./recipient";
import { assessmentRouter } from "./assessment";
import { careRecordRouter } from "./careRecord";
import { vitalSignRouter } from "./vitalSign";
import { medicationRouter } from "./medication";
import { handoverRouter } from "./handover";
import { careIncidentRouter } from "./careIncident";

export const appRouter = router({
  note: noteRouter,
  tag: tagRouter,
  link: linkRouter,
  ai: aiRouter,
  excel: excelRouter,
  incident: incidentRouter,
  event: eventRouter,
  role: roleRouter,
  actionItem: actionItemRouter,
  // 福祉システム用
  recipient: recipientRouter,
  assessment: assessmentRouter,
  careRecord: careRecordRouter,
  vitalSign: vitalSignRouter,
  medication: medicationRouter,
  handover: handoverRouter,
  careIncident: careIncidentRouter,
});

export type AppRouter = typeof appRouter;
