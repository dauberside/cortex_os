"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Clock,
  LogIn,
  LogOut,
  MapPin,
  CheckCircle,
  XCircle,
  History,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

export default function ClockPage() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Get today's status
  const { data: todayStatus, isLoading } =
    trpc.timeClock.getTodayStatus.useQuery(undefined, {
      refetchInterval: 30000, // Refetch every 30 seconds
    });

  // Mutations
  const clockInMutation = trpc.timeClock.clockIn.useMutation({
    onSuccess: () => {
      showToast("出勤打刻しました", "success");
      utils.timeClock.getTodayStatus.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const clockOutMutation = trpc.timeClock.clockOut.useMutation({
    onSuccess: () => {
      showToast("退勤打刻しました", "success");
      utils.timeClock.getTodayStatus.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  // Get GPS location
  const getLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("お使いのブラウザは位置情報に対応していません");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? "位置情報の取得が拒否されました"
            : "位置情報の取得に失敗しました"
        );
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Auto-get location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const handleClockIn = () => {
    clockInMutation.mutate({
      latitude: location?.latitude,
      longitude: location?.longitude,
      accuracy: location?.accuracy,
    });
  };

  const handleClockOut = () => {
    clockOutMutation.mutate({
      latitude: location?.latitude,
      longitude: location?.longitude,
      accuracy: location?.accuracy,
    });
  };

  // Calculate work duration if clocked in
  const [workDuration, setWorkDuration] = useState<string>("");

  useEffect(() => {
    if (todayStatus?.status === "CLOCKED_IN" && todayStatus.latestClockIn) {
      const interval = setInterval(() => {
        const now = new Date();
        const clockInTime = new Date(todayStatus.latestClockIn.occurredAt);
        const diff = now.getTime() - clockInTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setWorkDuration(`${hours}時間${minutes}分`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [todayStatus]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  const status = todayStatus?.status || "NOT_CLOCKED_IN";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg px-6 py-4 text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <Clock className="h-8 w-8" />
          <h1 className="text-3xl font-bold">勤怠打刻</h1>
        </div>
        <p className="text-muted-foreground mt-2">
          {session?.user?.name || session?.user?.email}
        </p>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), "yyyy年MM月dd日（E）", { locale: require("date-fns/locale/ja") })}
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-card mb-6 rounded-lg border p-8 text-center">
        {status === "NOT_CLOCKED_IN" && (
          <>
            <XCircle className="text-muted-foreground mx-auto mb-4 h-24 w-24" />
            <h2 className="mb-2 text-2xl font-bold">未出勤</h2>
            <p className="text-muted-foreground">
              出勤ボタンを押して勤務を開始してください
            </p>
          </>
        )}

        {status === "CLOCKED_IN" && todayStatus?.latestClockIn && (
          <>
            <CheckCircle className="mx-auto mb-4 h-24 w-24 text-green-600" />
            <h2 className="mb-2 text-2xl font-bold text-green-600">勤務中</h2>
            <p className="text-muted-foreground mb-2">
              出勤時刻:{" "}
              {format(
                new Date(todayStatus.latestClockIn.occurredAt),
                "HH:mm"
              )}
            </p>
            <p className="text-2xl font-semibold text-green-600">
              {workDuration}
            </p>
          </>
        )}

        {status === "CLOCKED_OUT" &&
          todayStatus?.latestClockIn &&
          todayStatus?.latestClockOut && (
            <>
              <CheckCircle className="mx-auto mb-4 h-24 w-24 text-blue-600" />
              <h2 className="mb-2 text-2xl font-bold text-blue-600">
                退勤済み
              </h2>
              <div className="text-muted-foreground space-y-1">
                <p>
                  出勤時刻:{" "}
                  {format(
                    new Date(todayStatus.latestClockIn.occurredAt),
                    "HH:mm"
                  )}
                </p>
                <p>
                  退勤時刻:{" "}
                  {format(
                    new Date(todayStatus.latestClockOut.occurredAt),
                    "HH:mm"
                  )}
                </p>
              </div>
            </>
          )}
      </div>

      {/* Location Info */}
      <div className="bg-card mb-6 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span className="font-medium">位置情報</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={getLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                取得中
              </>
            ) : (
              "再取得"
            )}
          </Button>
        </div>
        {location && (
          <div className="text-muted-foreground mt-2 text-sm">
            <p>緯度: {location.latitude.toFixed(6)}</p>
            <p>経度: {location.longitude.toFixed(6)}</p>
            <p>精度: 約{Math.round(location.accuracy)}m</p>
          </div>
        )}
        {locationError && (
          <div className="mt-2 text-sm text-red-600">{locationError}</div>
        )}
      </div>

      {/* Clock Buttons */}
      <div className="space-y-4">
        {status === "NOT_CLOCKED_IN" && (
          <Button
            className="h-16 w-full text-lg"
            onClick={handleClockIn}
            disabled={clockInMutation.isPending}
          >
            <LogIn className="mr-2 h-6 w-6" />
            出勤打刻
          </Button>
        )}

        {status === "CLOCKED_IN" && (
          <Button
            className="h-16 w-full text-lg"
            variant="outline"
            onClick={handleClockOut}
            disabled={clockOutMutation.isPending}
          >
            <LogOut className="mr-2 h-6 w-6" />
            退勤打刻
          </Button>
        )}

        {status === "CLOCKED_OUT" && (
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-muted-foreground">
              本日の勤務は終了しました
            </p>
          </div>
        )}
      </div>

      {/* Today's Events History */}
      {todayStatus?.events && todayStatus.events.length > 0 && (
        <div className="bg-card mt-8 rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5" />
            <h3 className="font-semibold">本日の打刻履歴</h3>
          </div>
          <div className="space-y-2">
            {todayStatus.events.map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between border-b pb-2 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  {event.type === "CLOCK_IN" ? (
                    <LogIn className="h-4 w-4 text-green-600" />
                  ) : (
                    <LogOut className="h-4 w-4 text-blue-600" />
                  )}
                  <span>
                    {event.type === "CLOCK_IN" ? "出勤" : "退勤"}
                  </span>
                </div>
                <div className="text-muted-foreground text-sm">
                  {format(new Date(event.occurredAt), "HH:mm:ss")}
                  {event.isModified && (
                    <span className="ml-2 text-xs text-orange-600">
                      (修正済)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-muted mt-8 rounded-lg p-4 text-sm">
        <h4 className="mb-2 font-semibold">ご注意</h4>
        <ul className="text-muted-foreground list-inside list-disc space-y-1">
          <li>打刻時には位置情報が記録されます</li>
          <li>打刻の修正が必要な場合は、リーダーまたは管理者にご連絡ください</li>
          <li>シフトと打刻時刻が大きく異なる場合は警告が表示されます</li>
        </ul>
      </div>
    </div>
  );
}
