"use client";
import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const CardUploader: React.FC<{ userId: string }> = ({ userId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdCards, setCreatedCards] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      toast.loading("Uploading file and generating cards...");

      const res = await axios.post(
        `http://localhost:3000/uploads/file/${userId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.dismiss();

      if (res.data.error) {
        toast.error("Upload failed: " + res.data.error);
      } else {
        setCreatedCards(res.data.cards || []);
        toast.success(`✅ ${res.data.cards.length} cards created!`);
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error("Upload error: " + err.message);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md w-full max-w-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        📤 Upload Learning Material
      </h2>

      <input
        type="file"
        accept=".pdf,.txt,.mp3,.wav,.mp4,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="mb-3"
      />

      {file && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Selected: {file.name}
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Upload & Generate Cards"}
      </button>

      {createdCards.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            ✅ Created Cards:
          </h3>
          <ul className="list-disc pl-5 mt-2 text-gray-700 dark:text-gray-300">
            {createdCards.map((c, i) => (
              <li key={i}>
                <strong>{c.title}</strong>: {c.content}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CardUploader;
