import React, { useState, useEffect } from "react";
import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { RecipientFormData } from "@/lib/validations/recipientSchema";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmergencyContactsSectionProps {
  watch: UseFormWatch<RecipientFormData>;
  setValue: UseFormSetValue<RecipientFormData>;
}

interface EmergencyContact {
  nameKana: string;
  name: string;
  relationship: string;
  phone: string;
  fax?: string;
}

export function EmergencyContactsSection({
  watch,
  setValue,
}: EmergencyContactsSectionProps) {
  const emergencyContactsData = watch("emergencyContacts") as any;

  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { nameKana: "", name: "", relationship: "", phone: "", fax: "" },
  ]);

  // 初期データの読み込み
  useEffect(() => {
    if (emergencyContactsData && Array.isArray(emergencyContactsData)) {
      setContacts(emergencyContactsData.length > 0 ? emergencyContactsData : [
        { nameKana: "", name: "", relationship: "", phone: "", fax: "" },
      ]);
    }
  }, []);

  // データ変更時にフォームに反映
  useEffect(() => {
    setValue("emergencyContacts", contacts as any);
  }, [contacts, setValue]);

  const addContact = () => {
    setContacts([...contacts, { nameKana: "", name: "", relationship: "", phone: "", fax: "" }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setContacts(newContacts);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">緊急連絡先</h3>
          <p className="text-muted-foreground text-sm">
            緊急時の連絡先を優先順位順に登録してください
          </p>
        </div>
        <Button type="button" onClick={addContact} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          追加
        </Button>
      </div>

      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div
            key={index}
            className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                連絡先 {index + 1}
              </span>
              {contacts.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeContact(index)}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* 氏名（ふりがな） */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  氏名（ふりがな）
                </label>
                <input
                  type="text"
                  value={contact.nameKana}
                  onChange={(e) => updateContact(index, "nameKana", e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="やまだ はなこ"
                />
              </div>

              {/* 氏名 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  氏名
                </label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => updateContact(index, "name", e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="山田 花子"
                />
              </div>

              {/* 続柄 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  続柄
                </label>
                <input
                  type="text"
                  value={contact.relationship}
                  onChange={(e) => updateContact(index, "relationship", e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="母"
                />
              </div>

              {/* 電話番号 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => updateContact(index, "phone", e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="03-1234-5678"
                />
              </div>

              {/* FAX番号 */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  FAX番号（任意）
                </label>
                <input
                  type="tel"
                  value={contact.fax || ""}
                  onChange={(e) => updateContact(index, "fax", e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="03-1234-5679"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
