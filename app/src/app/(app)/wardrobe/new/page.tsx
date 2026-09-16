import type { Metadata } from "next";
import { ItemUploader } from "@/components/item-uploader";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Add item" };

export default function NewItemPage() {
  return (
    <>
      <PageHeader
        title="Add a clothing item"
        description="Upload a clear photo of one item. AI will draft the attributes and you confirm or correct them before anything is saved."
      />
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        <ItemUploader />
      </div>
    </>
  );
}
