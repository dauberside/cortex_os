import { Badge } from "@/components/ui/badge";
import { Clock, FileText } from "lucide-react";

type GuideRecordStatus = "DRAFT" | "SUBMITTED";

interface GuideRecordStatusBadgeProps {
  status: GuideRecordStatus;
  className?: string;
}

export function GuideRecordStatusBadge({
  status,
  className,
}: GuideRecordStatusBadgeProps) {
  const config = {
    DRAFT: {
      label: "下書き",
      variant: "secondary" as const,
      icon: FileText,
      className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    },
    SUBMITTED: {
      label: "提出済み",
      variant: "default" as const,
      icon: Clock,
      className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    },
  };

  const { label, icon: Icon, className: badgeClassName } = config[status];

  return (
    <Badge className={`${badgeClassName} ${className || ""}`}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}
