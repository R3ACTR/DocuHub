"use client";

import { useState, useEffect } from "react";

export type RecentFile = {
  fileName: string;
  tool: string;
  time: string;
  link?: string;
};

export type DeletedFile = RecentFile & {
  deletedTime: string;
};

export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<DeletedFile[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedRecent = localStorage.getItem("recentFiles");
    const storedDeleted = localStorage.getItem("deletedRecentFiles");

    if (storedRecent) {
      setRecentFiles(JSON.parse(storedRecent));
    }
    if (storedDeleted) {
      setDeletedFiles(JSON.parse(storedDeleted));
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("recentFiles", JSON.stringify(recentFiles));
    }
  }, [recentFiles, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("deletedRecentFiles", JSON.stringify(deletedFiles));
    }
  }, [deletedFiles, mounted]);

  const addRecentFile = (file: RecentFile) => {
    setRecentFiles((prev) => [file, ...prev]);
  };

  const deleteRecentFile = (index: number) => {
    const fileToDelete = recentFiles[index];
    const newRecentFiles = recentFiles.filter((_, i) => i !== index);
    setRecentFiles(newRecentFiles);

    const deletedEntry: DeletedFile = {
      ...fileToDelete,
      deletedTime: new Date().toLocaleString(),
    };
    setDeletedFiles((prev) => [deletedEntry, ...prev]);
  };

  const restoreDeletedFile = (index: number) => {
    const fileToRestore = deletedFiles[index];
    const newDeletedFiles = deletedFiles.filter((_, i) => i !== index);
    setDeletedFiles(newDeletedFiles);

    const { deletedTime, ...rest } = fileToRestore;
    setRecentFiles((prev) => [rest, ...prev]);
  };

  const permanentlyDeleteFile = (index: number) => {
    setDeletedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearRecentHistory = () => {
    setRecentFiles([]);
  };

  const clearDeletedHistory = () => {
    setDeletedFiles([]);
  };

  return {
    recentFiles,
    deletedFiles,
    addRecentFile,
    deleteRecentFile,
    restoreDeletedFile,
    permanentlyDeleteFile,
    clearRecentHistory,
    clearDeletedHistory,
  };
}
