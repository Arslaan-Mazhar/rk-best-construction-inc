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
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        <h1 className="text-2xl font-bold">Material Bill Management</h1>

        <div className="w-20" />
      </div>


      {/* ---------------- FORM ---------------- */}
      <div className="bg-white p-5 rounded-xl shadow grid md:grid-cols-6 gap-3 items-center">
        <div className="md:col-span-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <ReceiptText size={18} />
          Add Material Bill
        </h2>
        </div>
        {/* JOB LIST (FIXED EMPTY ISSUE) */}
        <select
          className="border p-2 rounded"
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
          className="border p-2 rounded"
          value={materialAmount}
          onChange={(e) => setMaterialAmount(Number(e.target.value))}
        />

        {/* IMAGE */}
        <input
          type="file"
          className=" border p-2 rounded"
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
            className="w-12 h-12 rounded cursor-pointer object-cover"
          />
        )}

        {/* BUTTONS */}
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editId ? "Update" : "Save"}
        </button>

        {/* CANCEL BUTTON (NEW) */}
        {editId && (
          <button
            onClick={resetForm}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </div>

      {/* TOTAL */}
      <div className="text-lg font-semibold">
        Total Billing: ${total.toFixed(2)}
      </div>

      {/* ---------------- TABLE ---------------- */}
      <div className="bg-white shadow rounded-xl overflow-auto">
        <table className="w-full border-collapse">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Job ID</th>
              {/* <th className="p-3">Job Name</th> */}
              <th className="p-3">Amount</th>
              <th className="p-3">Image</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {billings.map((b) => (
              <tr key={b.id} className="border-t text-center">

                <td className="p-2">{b.jobId}</td>

                {/* FIXED JOB NAME ISSUE */}
                {/* <td className="p-2 font-medium">{b.jobName}</td> */}

                <td className="p-2">${b.materialAmount}</td>

                <td className="p-2">
                  {b.imageUrl && (
                    <img
                      src={b.imageUrl}
                      onClick={() => setModalImage(b.imageUrl!)}
                      className="w-10 h-10 mx-auto rounded cursor-pointer"
                    />
                  )}
                </td>

                <td className="p-2 flex justify-center gap-3">

                  <button onClick={() => handleEdit(b)}>
                    <Edit className="text-blue-600" />
                  </button>

                  <button onClick={() => handleDelete(b.id!)}>
                    <Trash2 className="text-red-600" />
                  </button>

                  {b.imageUrl && (
                    <a href={b.imageUrl} download target="_blank">
                      <Download className="text-green-600" />
                    </a>
                  )}

                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* ---------------- IMAGE MODAL (FULL VIEW) ---------------- */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">

          <div className="relative bg-white p-4 rounded">

            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2"
            >
              <X />
            </button>

            <img src={modalImage} className="max-w-[500px] max-h-[500px]" />

          </div>

        </div>
      )}

    </div>
  );
}