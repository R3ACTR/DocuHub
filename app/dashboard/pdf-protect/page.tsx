"use client";

import React, { useState } from "react";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt-lite";

export default function PdfProtectPage() {

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // NEW: feedback states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    if (e.target.files?.length) {

      setFile(e.target.files[0]);
      setError("");
      setSuccess("");

    }

  };

  const protectPdf = async () => {

    // Reset messages
    setError("");
    setSuccess("");

    if (!file) {

      setError("Please select a PDF file.");
      return;

    }

    if (!password) {

      setError("Please enter a password.");
      return;

    }

    try {

      setLoading(true);

      const pdfBytes = new Uint8Array(
        await file.arrayBuffer()
      );

      const encryptedBytes = await encryptPDF(
        pdfBytes,
        password,
        password
      );

      const blob = new Blob(
        [new Uint8Array(encryptedBytes)],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = "protected.pdf";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      // Success message
      setSuccess("PDF protected and downloaded successfully!");

    }
    catch (err) {

      console.error(err);

      setError("Encryption failed. Please try again.");

    }
    finally {

      setLoading(false);

    }

  };

  return (

    <div className="p-6 max-w-xl mx-auto">

      <h1 className="text-2xl font-bold mb-4">
        Protect PDF
      </h1>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded">
          {success}
        </div>
      )}

      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="mb-4 block w-full border border-gray-300 p-2 rounded"
      />

      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        className="mb-4 block w-full border border-gray-300 p-2 rounded"
      />

   <button
  onClick={protectPdf}
  disabled={loading}
  className={`px-4 py-2.5 rounded text-white transition ${
    loading
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  {loading ? "Protecting..." : "Protect PDF"}
</button>


    </div>

  );

}
