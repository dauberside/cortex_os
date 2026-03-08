import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";

// Cloudinary設定
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Cloudinary設定の確認
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      console.error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
      return NextResponse.json(
        { error: "Cloudinary設定が不完全です" },
        { status: 500 }
      );
    }

    // 認証チェック
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // FormDataを取得
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    // ファイルサイズチェック (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "ファイルサイズは5MB以下にしてください" },
        { status: 400 }
      );
    }

    // ファイルタイプチェック
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "画像ファイルのみアップロード可能です" },
        { status: 400 }
      );
    }

    // FileをBase64に変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Cloudinaryにアップロード
    const result = await cloudinary.uploader.upload(base64, {
      folder: "recipients",
      transformation: [
        { width: 500, height: 500, crop: "limit" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
