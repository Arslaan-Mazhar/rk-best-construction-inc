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
import * as Yup from "yup";
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

  const JobSchema = Yup.object({
    jobId: Yup.number().typeError("Job ID is required").required("Job ID is required"),
    jobName: Yup.string().required("Job Name is required"),
    totalContract: Yup.number().typeError("Total Contract is required").required("Total Contract is required"),
  });

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
      totalContract: Number(values.totalContract),
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
      <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        <h1 className="text-2xl font-bold text-center">
          Job Management
        </h1>

        <div className="hidden sm:block w-20" />
      </div>

      {/* FORM */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Briefcase size={18} />
          Add New Job
        </h2>

        <Formik
          initialValues={{ jobId: "", jobName: "", totalContract: "" }}
          validationSchema={JobSchema}
          onSubmit={async (values, { resetForm }) => {
            await addDoc(collection(db, "jobs"), {
              jobId: Number(values.jobId),
              jobName: values.jobName,
              totalContract: Number(values.totalContract),
            });

            fetchJobs();
            resetForm();
          }}
        >
          {({ handleChange, handleSubmit, handleBlur, values, errors, touched }) => {
            const formErrors = errors as Record<string, string | undefined>;
            return (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row flex-wrap gap-3 md:items-end"
            >
              <div className="w-full md:w-32">
                <input
                  name="jobId"
                  placeholder="Job ID"
                  value={values.jobId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${touched.jobId && formErrors.jobId ? "border-red-500" : ""}`}
                />
                {touched.jobId && formErrors.jobId && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.jobId}</p>
                )}
              </div>

              <div className="w-full md:w-48">
                <input
                  name="jobName"
                  placeholder="Job Name"
                  value={values.jobName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${touched.jobName && formErrors.jobName ? "border-red-500" : ""}`}
                />
                {touched.jobName && formErrors.jobName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.jobName}</p>
                )}
              </div>

              <div className="w-full md:w-40">
                <input
                  name="totalContract"
                  placeholder="Total Contract"
                  value={values.totalContract}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${touched.totalContract && formErrors.totalContract ? "border-red-500" : ""}`}
                />
                {touched.totalContract && formErrors.totalContract && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.totalContract}</p>
                )}
              </div>

              <button className="bg-black text-white px-4 py-2 rounded w-full md:w-auto flex items-center justify-center md:justify-start gap-2 hover:bg-gray-800 transition">
                <Save size={16} />
                Save Job
              </button>
            </form>
            );
          }}
        </Formik>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">

        <div className="grid grid-cols-4 bg-gray-200 p-3 font-bold text-sm">
          <span>Job ID</span>
          <span>Job Name</span>
          <span>Total Contract</span>
          <span>Actions</span>
        </div>

        {jobs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No jobs added yet</p>
          </div>
        ) : (
          jobs.map((job, index) => (
            <div
              key={job.id}
              className={`grid grid-cols-4 p-3 border-t items-center text-sm
                ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                hover:bg-blue-50`}
            >
              <span className="font-semibold">{job.jobId}</span>
              <span>{job.jobName}</span>
              <span className="text-blue-600 font-semibold">${job.totalContract}</span>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(job)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm font-medium transition"
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(job.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm font-medium transition"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Jobs List</h2>
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            <p>No jobs added yet</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500"
            >
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Job ID</p>
                  <p className="text-sm font-bold text-gray-900">{job.jobId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Contract</p>
                  <p className="text-sm font-bold text-blue-600">${job.totalContract}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 font-medium">Job Name</p>
                <p className="text-sm font-bold text-gray-900">{job.jobName}</p>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => openEdit(job)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-blue-700 transition"
                >
                  <Pencil size={16} /> Edit
                </button>

                <button
                  onClick={() => handleDelete(job.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-red-700 transition"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      {editOpen && editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Edit Job</h2>

              <button
                onClick={() => setEditOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <Formik
              initialValues={editData}
              enableReinitialize
              validationSchema={JobSchema}
              onSubmit={handleUpdate}
            >
              {({ values, handleChange, handleBlur, handleSubmit, errors, touched }) => {
                const formErrors = errors as Record<string, string | undefined>;
                return (
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Job ID</label>
                    <input
                      name="jobId"
                      value={values.jobId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${touched.jobId && formErrors.jobId ? "border-red-500" : "border-gray-300"}`}
                    />
                    {touched.jobId && formErrors.jobId && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.jobId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Job Name</label>
                    <input
                      name="jobName"
                      value={values.jobName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${touched.jobName && formErrors.jobName ? "border-red-500" : "border-gray-300"}`}
                    />
                    {touched.jobName && formErrors.jobName && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.jobName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Total Contract</label>
                    <input
                      name="totalContract"
                      value={values.totalContract}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${touched.totalContract && formErrors.totalContract ? "border-red-500" : "border-gray-300"}`}
                    />
                    {touched.totalContract && formErrors.totalContract && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.totalContract}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditOpen(false)}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      Update Job
                    </button>
                  </div>

                </form>
                );
              }}
            </Formik>

          </div>
        </div>
      )}

    </div>
  );
}