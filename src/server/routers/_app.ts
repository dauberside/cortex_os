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
import { careRecordRouter } from "./careRecord";
import { vitalSignRouter } from "./vitalSign";
import { medicationRouter } from "./medication";
import { handoverRouter } from "./handover";
import { careIncidentRouter } from "./careIncident";
import { guideRecordRouter } from "./guideRecord";
import { unitRouter } from "./unit";
import { dailyLogRouter } from "./dailyLog";
import { auditLogRouter } from "./auditLog";
import { serviceRecordRouter } from "./serviceRecord";
import { assessmentRouter } from "./assessment";
import { shiftTypeRouter } from "./shiftType";
import { shiftRouter } from "./shift";
import { timeClockRouter } from "./timeClock";
import { attendanceRouter } from "./attendance";
import { approvalRouter } from "./approval";
import { monthlyClosingRouter } from "./monthlyClosing";
import { supportRecordRouter } from "./supportRecord";

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
  careRecord: careRecordRouter,
  vitalSign: vitalSignRouter,
  medication: medicationRouter,
  handover: handoverRouter,
  careIncident: careIncidentRouter,
  guideRecord: guideRecordRouter,
  unit: unitRouter,
  dailyLog: dailyLogRouter,
  auditLog: auditLogRouter,
  serviceRecord: serviceRecordRouter,
  assessment: assessmentRouter,
  // 勤怠管理
  shiftType: shiftTypeRouter,
  shift: shiftRouter,
  timeClock: timeClockRouter,
  attendance: attendanceRouter,
  approval: approvalRouter,
  monthlyClosing: monthlyClosingRouter,
  // 支援記録
  supportRecord: supportRecordRouter,
});

export type AppRouter = typeof appRouter;
