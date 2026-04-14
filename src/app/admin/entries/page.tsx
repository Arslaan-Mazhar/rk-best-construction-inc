"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/../lib/firebase";

import { Formik, Form } from "formik";
import * as Yup from "yup";

import Link from "next/link";
import { ArrowLeft, Save, Trash2, Pencil, X } from "lucide-react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= VALIDATION ================= */
const EditSchema = Yup.object().shape({
  code: Yup.string().required("Required"),
  job: Yup.string().required("Required"),
  hours: Yup.number().required("Required").min(0),
  price: Yup.number().required("Required").min(0),
  paid: Yup.number().min(0),
});

/* ================= PAGE ================= */
export default function Entries() {
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    code: "",
    job: "",
    date: "",
  });


  /* EDIT MODAL */
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const [labours, setLabours] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const [selectedLabour, setSelectedLabour] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const [showLabourPopup, setShowLabourPopup] = useState(false);
  const [showJobPopup, setShowJobPopup] = useState(false);

  // FETCH DATA
  useEffect(() => {
    fetchData();

    const fetchDropdowns = async () => {
      const labourSnap = await getDocs(collection(db, "labours"));
      const jobSnap = await getDocs(collection(db, "jobs"));

      setLabours(
        labourSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );

      setJobs(
        jobSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    };

    fetchDropdowns();
  }, []);

  // SAVE ENTRY
  const handleSave = async () => {
    if (!selectedLabour || !selectedJob) return;

    await addDoc(collection(db, "entries"), {
      labourName: selectedLabour.name,
      labourCode: selectedLabour.code,
      jobName: selectedJob.title,
      jobCode: selectedJob.code,
      date: new Date().toISOString().split("T")[0],
    });

    alert("Saved!");
  };


  /* ================= FETCH ================= */
  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, "workEntries"));
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setData(list);
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= FILTER ================= */
  const filteredData = useMemo(() => {
    let temp = [...data];

    if (filters.code) {
      temp = temp.filter((i) =>
        i.code?.toLowerCase().includes(filters.code.toLowerCase())
      );
    }

    if (filters.job) {
      temp = temp.filter((i) =>
        i.job?.toLowerCase().includes(filters.job.toLowerCase())
      );
    }

    if (filters.date) {
      temp = temp.filter(
        (i) =>
          i.date?.toDate?.().toLocaleDateString() === filters.date
      );
    }

    return temp;
  }, [data, filters]);

  /* ================= ADD ================= */
  const handleAdd = async (values: any, resetForm: any) => {
    const amount = Number(values.hours) * Number(values.price);
    const paid = Number(values.paid || 0);

    await addDoc(collection(db, "workEntries"), {
      ...values,
      amount,
      paid,
      remaining: amount - paid,
      date: new Date(),
      code: values.code,
      job: values.job,
      labourName: labours.find(l => l.code === values.code)?.labourName || "",
      jobId: jobs.find(j => j.jobName === values.job)?.jobId || "",
    });

    fetchData();
    resetForm();
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "workEntries", id));
    setData((prev) => prev.filter((i) => i.id !== id)); // optimistic
  };

  /* ================= OPEN EDIT ================= */
  const openEdit = (item: any) => {
    setEditData({ ...item });
    setEditOpen(true);
  };

  /* ================= UPDATE ================= */
  const handleUpdate = async (values: any) => {
    const amount = Number(values.hours) * Number(values.price);
    const paid = Number(values.paid || 0);

    const updated = {
      ...values,
      amount,
      paid,
      remaining: amount - paid,
    };

    await updateDoc(doc(db, "workEntries", values.id), updated);

    // optimistic UI update
    setData((prev) =>
      prev.map((i) => (i.id === values.id ? { ...i, ...updated } : i))
    );

    setEditOpen(false);
    setEditData(null);
  };

  /* ================= EXPORT EXCEL ================= */
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Entries");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, "work_entries.xlsx");
  };

  /* ================= EXPORT PDF ================= */
  const exportPDF = () => {
    const docPdf = new jsPDF();

    autoTable(docPdf, {
      head: [["Code", "Job", "Hours", "Price", "Total", "Paid", "Remaining"]],
      body: filteredData.map((i) => [
        i.code,
        i.job,
        i.hours,
        i.price,
        i.amount,
        i.paid,
        i.remaining,
      ]),
    });

    docPdf.save("work_entries.pdf");
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <ArrowLeft size={18} /> Back
        </Link>

        <h1 className="text-2xl font-bold">Work Entries</h1>

        <div className="flex gap-2">
          <button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1 rounded">
            Excel
          </button>
          <button onClick={exportPDF} className="bg-red-600 text-white px-3 py-1 rounded">
            PDF
          </button>
        </div>
      </div>

      {/* ADD FORM */}
      <div className="bg-white p-4 rounded shadow mb-4">

        <Formik
          initialValues={{
            labourName: "",
            labourCode: "",
            jobName: "",
            jobCode: "",
            hours: "",
            price: "",
            paid: "",
          }}
          onSubmit={async (values, { resetForm }) => {
            const amount = Number(values.hours) * Number(values.price);
            const paid = Number(values.paid || 0);

            await addDoc(collection(db, "workEntries"), {
              ...values,
              amount,
              paid,
              remaining: amount - paid,
              date: new Date(),
              code: values.labourCode,
              job: values.jobName,
              labourName: labours.find(l => l.code === values.labourCode)?.labourName || "",
              jobId: jobs.find(j => j.jobName === values.jobName)?.jobId || "",
            });

            fetchData();
            resetForm();
            setSelectedLabour(null);
            setSelectedJob(null);
          }}
        >
          {({ values, setFieldValue, handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-center">

              {/* LABOUR DROPDOWN */}
              <div className="relative">
                <input
                  placeholder="Select Labour"
                  value={
                    values.labourName
                      ? `${values.labourName} (${values.labourCode})`
                      : ""
                  }
                  readOnly
                  onClick={() => setShowLabourPopup(true)}
                  className="border p-2 w-44 cursor-pointer bg-white"
                />

                {showLabourPopup && (
                  <div className="absolute bg-white border shadow w-44 max-h-40 overflow-y-auto z-50">
                    {labours.map((l) => (
                      <div
                        key={l.id}
                        className="p-2 hover:bg-gray-200 cursor-pointer"
                        onClick={() => {
                          setFieldValue("labourName", l.labourName);
                          setFieldValue("labourCode", l.code);
                          setFieldValue("price", l.rate || 0); // ✅ AUTO PRICE

                          setShowLabourPopup(false);
                        }}
                      >
                        {l.code} - {l.labourName} - {l.rate}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* JOB DROPDOWN */}
              <div className="relative">
                <input
                  placeholder="Select Job"
                  value={
                    values.jobName
                      ? `${values.jobName} (${values.jobCode})`
                      : ""
                  }
                  readOnly
                  onClick={() => setShowJobPopup(true)}
                  className="border p-2 w-44 cursor-pointer bg-white"
                />

                {showJobPopup && (
                  <div className="absolute bg-white border shadow w-44 max-h-40 overflow-y-auto z-50">
                    {jobs.map((j) => (
                      <div
                        key={j.id}
                        className="p-2 hover:bg-gray-200 cursor-pointer"
                        onClick={() => {
                          setFieldValue("jobName", j.jobName);
                          setFieldValue("jobCode", j.jobId);

                          setShowJobPopup(false);
                        }}
                      >
                        {j.jobId} - {j.jobName}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* HOURS */}
              <input
                name="hours"
                value={values.hours || ""}
                onChange={handleChange}
                placeholder="Hours"
                type="number"
                className="border p-2 w-24"
              />

              {/* PRICE */}
              <input
                name="price"
                onChange={handleChange}
                placeholder="Price"
                value={values.price || ""}
                type="number"
                className="border p-2 w-24"
              />

              {/* PAID */}
              <input
                name="paid"
                onChange={handleChange}
                placeholder="Paid"
                value={values.paid || ""}
                type="number"
                className="border p-2 w-24"
              />

              {/* SAVE BUTTON */}
              <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                <Save size={16} /> Save
              </button>
            </form>
          )}
        </Formik>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded shadow mb-4 flex gap-2 flex-wrap">
        <input placeholder="Code"
          onChange={(e) => setFilters({ ...filters, code: e.target.value })}
          className="border p-2" />

        <input placeholder="Job"
          onChange={(e) => setFilters({ ...filters, job: e.target.value })}
          className="border p-2" />

        <input type="date"
          onChange={(e) =>
            setFilters({
              ...filters,
              date: new Date(e.target.value).toLocaleDateString(),
            })
          }
          className="border p-2" />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow">
        <div className="grid grid-cols-9 bg-gray-200 p-3 font-semibold">
          <span>Date</span>
          <span>Code</span>
          <span>Job</span>
          <span>Hours</span>
          <span>Price</span>
          <span>Total</span>
          <span>Paid</span>
          <span>Remaining</span> {/* ✅ ADDED */}
          <span>Actions</span>
        </div>

        {filteredData.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-9 p-3 border-t items-center"
          >
            {/* DATE */}
            <span>{item.date?.toDate?.().toLocaleDateString()}</span>

            {/* CODE */}
            <span>{item.code}</span>

            {/* JOB */}
            <span>{item.job}</span>

            {/* HOURS */}
            <span>{item.hours}</span>

            {/* PRICE */}
            <span>{item.price}</span>

            {/* TOTAL */}
            <span className="font-semibold">
              {item.amount || 0}
            </span>

            {/* PAID */}
            <span className="text-green-600">
              {item.paid || 0}
            </span>

            {/* REMAINING (NEW FIX) */}
            <span className="text-red-600 font-bold">
              {item.remaining ??
                (Number(item.amount || 0) - Number(item.paid || 0))}
            </span>

            {/* ACTIONS */}
            <div className="flex gap-2">
              <button onClick={() => openEdit(item)} className="text-blue-600">
                <Pencil size={18} />
              </button>

              <button onClick={() => handleDelete(item.id)} className="text-red-600">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editOpen && editData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          {/* MODAL BOX (animated) */}
          <div className="bg-white w-[520px] rounded-xl shadow-2xl p-6 animate-[fadeIn_0.2s_ease-in-out] scale-100">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Entry</h2>

              <button
                onClick={() => setEditOpen(false)}
                className="text-gray-500 hover:text-red-600"
              >
                <X />
              </button>
            </div>

            {/* FORM */}
            <Formik
              initialValues={editData}
              enableReinitialize
              validationSchema={EditSchema}
              onSubmit={handleUpdate}
            >
              {({ values, handleChange, handleSubmit, errors, touched, setFieldValue }) => (
                <Form onSubmit={handleSubmit} className="flex flex-col gap-3">

                  {/* CODE */}
                  {/* <div className="flex items-center gap-3">
                    <label className="w-24 text-sm font-medium">Code</label>
                    <input
                      name="code"
                      value={values.code}
                      onChange={handleChange}
                      className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 outline-none"
                      autoFocus
                    />
                  </div>
                  {touched.code && errors.code && typeof errors.code === "string" && (
                    <p className="text-red-500 text-xs ml-24">{errors.code}</p>
                  )}

                  
                  <div className="flex items-center gap-3">
                    <label className="w-24 text-sm font-medium">Job</label>
                    <input
                      name="job"
                      value={values.job}
                      onChange={handleChange}
                      className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div> */}

                  {/* PRICE */}
                  {/* <div className="flex items-center gap-3">
                    <label className="w-24 text-sm font-medium">Price</label>
                    <input
                      name="price"
                      type="number"
                      value={values.price}
                      onChange={handleChange}
                      className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div> */}



                  {/* HOURS */}
                  {/* <div className="flex items-center gap-3">
                    <label className="w-24 text-sm font-medium">Hours</label>
                    <input
                      name="hours"
                      type="number"
                      value={values.hours}
                      onChange={handleChange}
                      className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div> */}

                  <select
                    name="code"
                    onChange={(e) => {
                      handleChange(e);

                      const selected = labours.find(
                        (l) => l.code === e.target.value
                      );

                      if (selected) {
                        setFieldValue("price", selected.rate || 0);
                      }
                    }}
                    className="border p-2 w-40"
                  >
                    <option value="">Select Labour</option>
                    {labours.map((l) => (
                      <option key={l.id} value={l.code}>
                        {l.code} - {l.labourName}
                      </option>
                    ))}
                  </select>

                  <select
                    name="job"
                    onChange={handleChange}
                    className="border p-2 w-40"
                  >
                    <option value="">Select Job</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.jobName}>
                        {j.jobId} - {j.jobName}
                      </option>
                    ))}
                  </select>

                  <input
                    name="hours"
                    onChange={handleChange}
                    placeholder="Hours"
                    className="border p-2 w-24"
                  />

                  <input
                    name="price"
                    onChange={handleChange}
                    placeholder="Price"
                    className="border p-2 w-24"
                  />



                  {/* PAID */}
                  <div className="flex items-center gap-3">
                    <label className="w-24 text-sm font-medium">Paid</label>
                    <input
                      name="paid"
                      type="number"
                      value={values.paid}
                      onChange={handleChange}
                      className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>

                  {/* AUTO TOTAL */}
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <label className="w-24 font-medium">Total</label>
                    <span className="font-semibold text-black">
                      {Number(values.hours || 0) * Number(values.price || 0)}
                    </span>
                  </div>

                  {/* BUTTON */}
                  <button
                    type="submit"
                    className="bg-green-600 text-white py-2 mt-3 rounded flex items-center justify-center gap-2 hover:bg-green-700 transition"
                  >
                    <Save size={16} /> Update Entry
                  </button>

                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

    </div>
  );
}



