"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/../lib/firebase";
import { Formik } from "formik";

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);

  // 🔹 Fetch Jobs
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

  // 🔹 Delete Job
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "jobs", id));
    fetchJobs();
  };

  return (
    <div className="p-10 space-y-6">

      {/* ✅ FORM */}
      <div>
        <h2 className="text-xl font-bold mb-2">Add Job</h2>

        <Formik
          initialValues={{ jobId: "", jobName: "" }}
          onSubmit={async (values, { resetForm }) => {
            await addDoc(collection(db, "jobs"), {
              jobId: Number(values.jobId),
              jobName: values.jobName,
            });

            fetchJobs();
            resetForm();
          }}
        >
          {({ handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                name="jobId"
                placeholder="Job ID"
                onChange={handleChange}
                className="border p-2"
              />

              <input
                name="jobName"
                placeholder="Job Name"
                onChange={handleChange}
                className="border p-2"
              />

              <button className="bg-black text-white px-4 py-2">
                Save Job
              </button>
            </form>
          )}
        </Formik>
      </div>

      {/* ✅ TABLE VIEW */}
      <div className="border rounded">

        {/* Header */}
        <div className="grid grid-cols-3 bg-gray-200 p-2 font-bold">
          <span>Job ID</span>
          <span>Job Name</span>
          <span>Action</span>
        </div>

        {/* Rows */}
        {jobs.map((job) => (
          <div
            key={job.id}
            className="grid grid-cols-3 border-t p-2 items-center"
          >
            <span>{job.jobId}</span>
            <span>{job.jobName}</span>

            <button
              onClick={() => handleDelete(job.id)}
              className="bg-red-500 text-white px-2 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}