"use client";

import React, { useState } from "react";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt-lite";

export default function PdfProtectPage() {

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    if (e.target.files?.length) {

      setFile(e.target.files[0]);

    }

  };

  const protectPdf = async () => {

    if (!file) {

      alert("Select PDF first");
      return;

    }

    if (!password) {

      alert("Enter password");
      return;

    }

    try {

      setLoading(true);

      const pdfBytes = new Uint8Array(
        await file.arrayBuffer()
      );

      // REAL encryption
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

      a.click();

      URL.revokeObjectURL(url);

    }
    catch (err) {

      console.error(err);

      alert("Encryption failed");

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

      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="mb-4 block w-full border p-2"
      />

      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        className="mb-4 block w-full border p-2"
      />

      <button
        onClick={protectPdf}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading
          ? "Protecting..."
          : "Protect PDF"}
      </button>

    </div>

  );

}
