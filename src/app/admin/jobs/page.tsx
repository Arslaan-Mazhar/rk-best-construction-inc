"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/../lib/firebase";
import { Formik } from "formik";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  Pencil,
  Briefcase,
  X,
} from "lucide-react";

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const fetchJobs = async () => {
    const snapshot = await getDocs(collection(db, "jobs"));

    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setJobs(list);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "jobs", id));
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const openEdit = (job: any) => {
    setEditData(job);
    setEditOpen(true);
  };

  const handleUpdate = async (values: any) => {
    await updateDoc(doc(db, "jobs", values.id), {
      jobId: Number(values.jobId),
      jobName: values.jobName,
      totalContractAmount: Number(values.totalContractAmount),
    });

    setJobs((prev) =>
      prev.map((j) =>
        j.id === values.id ? { ...j, ...values } : j
      )
    );

    setEditOpen(false);
    setEditData(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        <h1 className="text-2xl font-bold text-center flex-1">
          Job Management
        </h1>

        <div className="w-20" />
      </div>

      {/* FORM */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Briefcase size={18} />
          Add New Job
        </h2>

        <Formik
          initialValues={{ jobId: "", jobName: "", totalContractAmount: "" }}
          onSubmit={async (values, { resetForm }) => {
            await addDoc(collection(db, "jobs"), {
              jobId: Number(values.jobId),
              jobName: values.jobName,
              totalContractAmount: Number(values.totalContractAmount),
            });

            fetchJobs();
            resetForm();
          }}
        >
          {({ handleChange, handleSubmit }) => (
            <form
              onSubmit={handleSubmit}
              className="flex flex-wrap gap-3 items-end"
            >
              <input
                name="jobId"
                placeholder="Job ID"
                onChange={handleChange}
                className="border p-2 rounded w-32"
              />

              <input
                name="jobName"
                placeholder="Job Name"
                onChange={handleChange}
                className="border p-2 rounded w-48"
              />

              <input
                name="totalContractAmount"
                placeholder="Total Contract"
                onChange={handleChange}
                className="border p-2 rounded w-40"
              />

              <button className="bg-black text-white px-4 py-2 rounded flex items-center gap-2">
                <Save size={16} />
                Save Job
              </button>
            </form>
          )}
        </Formik>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        <div className="grid grid-cols-5 bg-gray-200 p-3 font-bold">
          <span>Job ID</span>
          <span>Job Name</span>
          <span>Total Contract</span>
          <span>Actions</span>
        </div>

        {jobs.map((job, index) => (
          <div
            key={job.id}
            className={`grid grid-cols-5 p-3 border-t items-center
              ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              hover:bg-blue-50`}
          >
            <span>{job.jobId}</span>
            <span>{job.jobName}</span>
            <span>{job.totalContractAmount}</span>

            <div className="flex gap-2">

              <button
                onClick={() => openEdit(job)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"
              >
                <Pencil size={16} />
                Edit
              </button>

              <button
                onClick={() => handleDelete(job.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
              >
                <Trash2 size={16} />
                Delete
              </button>

            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editOpen && editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white w-[450px] rounded-xl shadow-lg p-6 relative">

            <button
              onClick={() => setEditOpen(false)}
              className="absolute right-3 top-3 text-gray-500 hover:text-red-600"
            >
              <X />
            </button>

            <h2 className="text-xl font-bold mb-4">Edit Job</h2>

            <Formik
              initialValues={editData}
              enableReinitialize
              onSubmit={handleUpdate}
            >
              {({ values, handleChange, handleSubmit }) => (
                <form onSubmit={handleSubmit} className="space-y-3">

                  <div>
                    <label>Job ID</label>
                    <input
                      name="jobId"
                      value={values.jobId}
                      onChange={handleChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>

                  <div>
                    <label>Job Name</label>
                    <input
                      name="jobName"
                      value={values.jobName}
                      onChange={handleChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>

                  <div>
                    <label>Total Contract Amount</label>
                    <input
                      name="totalContractAmount"
                      value={values.totalContractAmount}
                      onChange={handleChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-green-600 text-white w-full py-2 rounded flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Update Job
                  </button>

                </form>
              )}
            </Formik>

          </div>
        </div>
      )}

    </div>
  );
}