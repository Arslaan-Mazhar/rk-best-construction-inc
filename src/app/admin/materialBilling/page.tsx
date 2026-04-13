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

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/../lib/firebase";
import { Edit, Trash2 } from "lucide-react";

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
  totalAmount: number;
};

export default function MaterialBillingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);

  const [jobId, setJobId] = useState("");
  const [jobName, setJobName] = useState("");
  const [materialAmount, setMaterialAmount] = useState<number>(0);
  const [image, setImage] = useState<File | null>(null);

  const [editId, setEditId] = useState<string | null>(null);

  // ---------------- FETCH JOBS ----------------
  const fetchJobs = async () => {
    const snap = await getDocs(collection(db, "jobs"));
    setJobs(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }))
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

  // ---------------- IMAGE UPLOAD ----------------
  const uploadImage = async (file: File) => {
    const imageRef = ref(storage, `billing/${Date.now()}-${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    let imageUrl = "";

    if (image) {
      imageUrl = await uploadImage(image);
    }

    const data: Billing = {
      jobId,
      jobName,
      materialAmount,
      totalAmount: materialAmount, // can extend formula later
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

  const resetForm = () => {
    setJobId("");
    setJobName("");
    setMaterialAmount(0);
    setImage(null);
    setEditId(null);
  };

  // ---------------- EDIT ----------------
  const handleEdit = (b: Billing) => {
    setJobId(b.jobId);
    setJobName(b.jobName);
    setMaterialAmount(b.materialAmount);
    setEditId(b.id || null);
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "materialBilling", id));
    fetchBillings();
  };

  return (
    <div className="p-6 space-y-6">

      {/* ---------------- FORM ---------------- */}
      <div className="bg-white shadow p-4 rounded grid grid-cols-4 gap-4">

        {/* JOB DROPDOWN */}
        <select
          className="border p-2"
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

        {/* MATERIAL AMOUNT */}
        <input
          type="number"
          placeholder="Material Amount (USD)"
          className="border p-2"
          value={materialAmount}
          onChange={(e) => setMaterialAmount(Number(e.target.value))}
        />

        {/* IMAGE */}
        <input
          type="file"
          className="border p-2"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editId ? "Update Billing" : "Add Billing"}
        </button>
      </div>

      {/* ---------------- TOTAL DISPLAY ---------------- */}
      <div className="text-xl font-bold">
        Total Material Billing: $
        {billings.reduce((sum, b) => sum + b.materialAmount, 0).toFixed(2)}
      </div>

      {/* ---------------- TABLE ---------------- */}
      <div className="overflow-auto bg-white shadow rounded">
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Job ID</th>
              <th className="p-2">Job Name</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Image</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {billings.map((b) => (
              <tr key={b.id} className="border-t text-center">

                <td className="p-2">{b.jobId}</td>
                <td className="p-2">{b.jobName}</td>
                <td className="p-2">${b.materialAmount}</td>

                <td className="p-2">
                  {b.imageUrl && (
                    <img
                      src={b.imageUrl}
                      className="w-12 h-12 object-cover mx-auto"
                    />
                  )}
                </td>

                <td className="p-2 flex justify-center gap-3">
                  <button onClick={() => handleEdit(b)}>
                    <Edit className="text-blue-500" />
                  </button>

                  <button onClick={() => handleDelete(b.id!)}>
                    <Trash2 className="text-red-500" />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}