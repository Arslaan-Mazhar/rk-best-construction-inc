"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import Link from "next/link";
import { db } from "@/../lib/firebase";
import { ArrowLeft, Edit, Trash2, X, Download, ReceiptText } from "lucide-react";
import Image from "next/image";

type Job = {
  id: string;
  jobId: string;
  jobName: string;
};

type Billing = {
  id?: string;
  jobId: string;
  jobName: string;
  materialAmount: number;
  imageUrl?: string;
};

export default function MaterialBillingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);

  const [jobId, setJobId] = useState("");
  const [jobName, setJobName] = useState("");
  const [materialAmount, setMaterialAmount] = useState<number>(0);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const [editId, setEditId] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // ---------------- FETCH JOBS ----------------
  const fetchJobs = async () => {
    const snap = await getDocs(collection(db, "jobs"));

    setJobs(
      snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          jobId: data.jobId || "",
          jobName: data.jobName || "",
        };
      })
    );
  };

  // ---------------- FETCH BILLINGS ----------------
  const fetchBillings = async () => {
    const snap = await getDocs(collection(db, "materialBilling"));

    setBillings(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }))
    );
  };

  useEffect(() => {
    fetchJobs();
    fetchBillings();
  }, []);

  // ---------------- CLOUDINARY UPLOAD ----------------
  const uploadImage = async (file: File) => {
    const formData = new FormData();
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);
    // formData.append("cloud_name", cloudName);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return data.secure_url;
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    if (!jobId || !materialAmount) return alert("Fill required fields");

    let imageUrl = preview;

    if (image) {
      imageUrl = await uploadImage(image);
    }

    const data: Billing = {
      jobId,
      jobName,
      materialAmount,
      imageUrl,
    };

    if (editId) {
      await updateDoc(doc(db, "materialBilling", editId), data);
    } else {
      await addDoc(collection(db, "materialBilling"), data);
    }

    resetForm();
    fetchBillings();
  };

  // ---------------- RESET / CANCEL ----------------
  const resetForm = () => {
    setJobId("");
    setJobName("");
    setMaterialAmount(0);
    setImage(null);
    setPreview("");
    setEditId(null);
  };

  // ---------------- EDIT ----------------
  const handleEdit = (b: Billing) => {
    setJobId(b.jobId);
    setJobName(b.jobName);
    setMaterialAmount(b.materialAmount);
    setPreview(b.imageUrl || "");
    setEditId(b.id || null);
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await deleteDoc(doc(db, "materialBilling", id));
    fetchBillings();
  };

  const total = billings.reduce((sum, b) => sum + b.materialAmount, 0);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        <h1 className="text-2xl font-bold text-center">Material Bill Management</h1>

        <div className="hidden sm:block w-20" />
      </div>


      {/* ---------------- FORM ---------------- */}
      <div className="bg-white p-5 rounded-xl shadow">
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ReceiptText size={18} />
            Add Material Bill
          </h2>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-end md:items-end">
          {/* JOB LIST (FIXED EMPTY ISSUE) */}
          <select
            className="border p-2 rounded w-full md:flex-1 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            value={jobId}
            onChange={(e) => {
              const selected = jobs.find(j => j.jobId === e.target.value);

              setJobId(e.target.value);
              setJobName(selected?.jobName || "");
            }}
          >
            <option value="">Select Job</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.jobId}>
                {j.jobId} - {j.jobName}
              </option>
            ))}
          </select>

          {/* AMOUNT */}
          <input
            type="number"
            placeholder="Amount"
            className="border p-2 rounded w-full md:w-32 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            value={materialAmount}
            onChange={(e) => setMaterialAmount(Number(e.target.value))}
          />

          {/* IMAGE */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="border p-2 rounded w-full md:w-auto focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setImage(file || null);
              if (file) setPreview(URL.createObjectURL(file));
            }}
          />

          {/* PREVIEW SMALL */}
          {preview && (
            <img
              src={preview}
              onClick={() => setModalImage(preview)}
              className="w-12 h-12 rounded cursor-pointer object-cover mx-auto md:mx-0"
            />
          )}

          {/* BUTTONS */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleSubmit}
              className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
            >
              {editId ? "Update" : "Save"}
            </button>

            {/* CANCEL BUTTON (NEW) */}
            {editId && (
              <button
                onClick={resetForm}
                className="flex-1 md:flex-none bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TOTAL */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <p className="text-lg font-semibold text-gray-800">
          Total Billing: <span className="text-blue-600">${total.toFixed(2)}</span>
        </p>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white shadow rounded-xl overflow-auto">
        <table className="w-full border-collapse">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left font-semibold">Job ID</th>
              <th className="p-3 text-left font-semibold">Amount</th>
              <th className="p-3 text-left font-semibold">Image</th>
              <th className="p-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {billings.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  No billing records yet
                </td>
              </tr>
            ) : (
              billings.map((b) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">

                  <td className="p-3 font-semibold">{b.jobId}</td>

                  <td className="p-3 text-blue-600 font-semibold">${b.materialAmount}</td>

                  <td className="p-3">
                    {b.imageUrl && (
                      <img
                        src={b.imageUrl}
                        onClick={() => setModalImage(b.imageUrl!)}
                        className="w-10 h-10 rounded cursor-pointer hover:opacity-80 transition object-cover"
                      />
                    )}
                  </td>

                  <td className="p-3 flex justify-center gap-3">

                    <button onClick={() => handleEdit(b)} className="text-blue-600 hover:scale-110 transition">
                      <Edit size={18} />
                    </button>

                    <button onClick={() => handleDelete(b.id!)} className="text-red-600 hover:scale-110 transition">
                      <Trash2 size={18} />
                    </button>

                    {b.imageUrl && (
                      <a href={b.imageUrl} download target="_blank" rel="noopener noreferrer">
                        <Download size={18} className="text-green-600 hover:scale-110 transition" />
                      </a>
                    )}

                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">Billing Records</h2>
        {billings.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            <p>No billing records yet</p>
          </div>
        ) : (
          billings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500"
            >
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Job ID</p>
                  <p className="text-sm font-bold text-gray-900">{b.jobId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Amount</p>
                  <p className="text-sm font-bold text-blue-600">${b.materialAmount}</p>
                </div>
              </div>

              {b.imageUrl && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={b.imageUrl}
                    onClick={() => setModalImage(b.imageUrl!)}
                    className="w-32 h-32 rounded cursor-pointer object-cover hover:opacity-80 transition"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => handleEdit(b)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-blue-700 transition"
                >
                  <Edit size={16} /> Edit
                </button>

                <button
                  onClick={() => handleDelete(b.id!)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-red-700 transition"
                >
                  <Trash2 size={16} /> Delete
                </button>

                {b.imageUrl && (
                  <a
                    href={b.imageUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-green-700 transition"
                  >
                    <Download size={16} /> Download
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ------------ IMAGE MODAL (FULL VIEW) ------------ */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">

          <div className="relative bg-white p-4 rounded-lg shadow-2xl max-w-md md:max-w-2xl w-full">

            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            <img src={modalImage} className="w-full rounded object-cover" />

          </div>

        </div>
      )}

    </div>
  );
}