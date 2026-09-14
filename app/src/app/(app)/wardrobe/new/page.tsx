import type { Metadata } from "next";
import { ItemUploader } from "@/components/item-uploader";

export const metadata: Metadata = { title: "Add item" };

export default function NewItemPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">Add a clothing item</h1>
      <p className="mt-1 text-sm text-stone-500">
        Upload a clear photo of one item. AI will draft the attributes and you
        confirm or correct them before anything is saved.
      </p>
      <div className="mt-6">
        <ItemUploader />
      </div>
    </div>
  );
}
