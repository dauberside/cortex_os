"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";

export default function VPNListPage() {
  const params = useParams();
  const recipientId = params.id as string;

  const { data: recipient } = trpc.recipient.get.useQuery({ id: recipientId });
  const { data: vpnRecords, isLoading } = trpc.vitalSign.list.useQuery({
    recipientId,
    limit: 50,
  });

  // ラベル変換
  const labels = {
    consciousness: {
      Clear: "清明",
      Drowsy: "傾眠",
      Stupor: "昏迷",
      Coma: "昏睡",
    },
    mobility: {
      Independent: "自立",
      Assisted: "介助あり",
      Wheelchair: "車椅子",
      Bedridden: "寝たきり",
    },
    skinCondition: {
      Normal: "正常",
      Dry: "乾燥",
      Rash: "発疹",
      Wound: "創傷",
      Pressure: "褥瘡",
    },
    excretion: {
      Normal: "正常",
      Constipation: "便秘",
      Diarrhea: "下痢",
      Urinary: "尿失禁",
    },
    mealIntake: {
      Full: "全量",
      ThreeQuarters: "3/4",
      Half: "半量",
      Quarter: "1/4",
      None: "未摂取",
    },
    waterIntake: { Adequate: "適切", Insufficient: "不足", Excessive: "過剰" },
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/recipients/${recipientId}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          利用者詳細に戻る
        </Button>
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">VPN記録</h1>
          {recipient && (
            <p className="text-muted-foreground">
              {recipient.name} さんのVPN記録一覧
            </p>
          )}
        </div>
        <Link href={`/recipients/${recipientId}/vpn/new`}>
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            VPN記録登録
          </Button>
        </Link>
      </div>

      {/* VPN記録一覧 */}
      <div className="bg-card rounded-lg border">
        {vpnRecords && vpnRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <p className="text-muted-foreground mb-4 text-lg">
              VPN記録がまだありません
            </p>
            <Link href={`/recipients/${recipientId}/vpn/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                最初のVPN記録を登録
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {vpnRecords?.map((record) => (
              <div
                key={record.id}
                className="hover:bg-accent p-6 transition-colors"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold">
                      {new Date(record.measuredAt).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      記録者: {record.user.name || "不明"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* V - Vital signs */}
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-blue-600">
                      V - Vital signs
                    </h3>
                    <div className="space-y-1 text-sm">
                      {record.temperature && <p>体温: {record.temperature}℃</p>}
                      {record.systolic && record.diastolic && (
                        <p>
                          血圧: {record.systolic}/{record.diastolic} mmHg
                        </p>
                      )}
                      {record.pulse && <p>脈拍: {record.pulse} 回/分</p>}
                      {record.spo2 && <p>SpO2: {record.spo2}%</p>}
                      {record.weight && <p>体重: {record.weight} kg</p>}
                    </div>
                  </div>

                  {/* P - Physical status */}
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-green-600">
                      P - Physical status
                    </h3>
                    <div className="space-y-1 text-sm">
                      {record.consciousness && (
                        <p>
                          意識:{" "}
                          {
                            labels.consciousness[
                              record.consciousness as keyof typeof labels.consciousness
                            ]
                          }
                        </p>
                      )}
                      {record.mobility && (
                        <p>
                          移動:{" "}
                          {
                            labels.mobility[
                              record.mobility as keyof typeof labels.mobility
                            ]
                          }
                        </p>
                      )}
                      {record.skinCondition && (
                        <p>
                          皮膚:{" "}
                          {
                            labels.skinCondition[
                              record.skinCondition as keyof typeof labels.skinCondition
                            ]
                          }
                        </p>
                      )}
                      {record.excretion && (
                        <p>
                          排泄:{" "}
                          {
                            labels.excretion[
                              record.excretion as keyof typeof labels.excretion
                            ]
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* N - Nutrition */}
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-orange-600">
                      N - Nutrition
                    </h3>
                    <div className="space-y-1 text-sm">
                      {record.mealIntake && (
                        <p>
                          食事:{" "}
                          {
                            labels.mealIntake[
                              record.mealIntake as keyof typeof labels.mealIntake
                            ]
                          }
                        </p>
                      )}
                      {record.waterIntake && (
                        <p>
                          水分:{" "}
                          {
                            labels.waterIntake[
                              record.waterIntake as keyof typeof labels.waterIntake
                            ]
                          }
                        </p>
                      )}
                      {record.nutritionNote && (
                        <p className="text-muted-foreground text-xs">
                          {record.nutritionNote}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm">
                      <span className="font-semibold">備考:</span>{" "}
                      {record.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
