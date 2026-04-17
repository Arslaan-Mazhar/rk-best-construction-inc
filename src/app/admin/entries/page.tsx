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
import { useRef } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import Link from "next/link";
import { ArrowLeft, Save, Trash2, Pencil, X } from "lucide-react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= VALIDATION ================= */
const AddSchema = Yup.object().shape({
  labourCode: Yup.string().required("Labour is required"),
  jobName: Yup.string().required("Job is required"),
  hours: Yup.number(),
  price: Yup.number(),
  paid: Yup.number(),
});

const EditSchema = Yup.object().shape({
  code: Yup.string().required("Labour is required"),
  job: Yup.string().required("Job is required"),
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
    startDate: "",
    endDate: "",
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
  const [showCodeTotals, setShowCodeTotals] = useState(false);

  const [labourSearch, setLabourSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");

  const labourRef = useRef<HTMLDivElement>(null);
  const jobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (labourRef.current && !labourRef.current.contains(e.target)) {
        setShowLabourPopup(false);
      }
      if (jobRef.current && !jobRef.current.contains(e.target)) {
        setShowJobPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLabours = labours.filter((l) =>
    `${l.code} ${l.name} ${l.rate}`
      .toLowerCase()
      .includes(labourSearch.toLowerCase())
  );

  const filteredJobs = jobs.filter((j) =>
    `${j.jobId || ""} ${j.jobName || ""}`.toLowerCase().includes(jobSearch.toLowerCase())
  );

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
      name: selectedLabour.name,
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
        `${i.code || ""} ${i.name || ""}`.toLowerCase().includes(filters.code.toLowerCase())
      );
    }

    if (filters.job) {
      temp = temp.filter((i) =>
        `${i.jobId || ""} ${i.job || ""}`.toLowerCase().includes(filters.job.toLowerCase())
      );
    }

    if (filters.startDate || filters.endDate) {
      temp = temp.filter((i) => {
        const itemDate = i.date?.toDate?.();
        if (!itemDate) return false;

        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;

        if (startDate && endDate) {
          return itemDate >= startDate && itemDate <= endDate;
        } else if (startDate) {
          return itemDate >= startDate;
        } else if (endDate) {
          return itemDate <= endDate;
        }
        return true;
      });
    }

    return temp;
  }, [data, filters]);

  const groupedTotals = useMemo(() => {
    const groups: Record<
      string,
      {
        code: string;
        name: string;
        totalAmount: number;
        totalPaid: number;
        totalRemaining: number;
        count: number;
      }
    > = {};

    filteredData.forEach((item) => {
      const code = item.code || "Unknown";
      const name = item.name || "";
      const amount = Number(item.amount || 0);
      const paid = Number(item.paid || 0);
      const remaining = Number(item.remaining ?? amount - paid);

      if (!groups[code]) {
        groups[code] = {
          code,
          name,
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
          count: 0,
        };
      }

      groups[code].name = groups[code].name || name;
      groups[code].totalAmount += amount;
      groups[code].totalPaid += paid;
      groups[code].totalRemaining += remaining;
      groups[code].count += 1;
    });

    return Object.values(groups);
  }, [filteredData]);

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
      name: labours.find(l => l.code === values.code)?.name || "",
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
      head: [["Code", "Job", "Hours", "Price", "Total", "Paid", "Remaining", "Comment"]],
      body: filteredData.map((i) => [
        i.code,
        i.job,
        i.hours,
        i.price,
        i.amount,
        i.paid,
        i.remaining,
        i.comment,
      ]),
    });

    docPdf.save("work_entries.pdf");
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <ArrowLeft size={18} /> Back
        </Link>

        <h1 className="text-2xl font-bold">Work Entries</h1>

        <div className="hidden sm:flex gap-2">
          <button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">
            Excel
          </button>
          <button onClick={exportPDF} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm">
            PDF
          </button>
        </div>
      </div>

      {/* ADD FORM */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Entry</h3>
        <Formik
          initialValues={{
            name: "",
            labourCode: "",
            jobName: "",
            jobCode: "",
            hours: "",
            price: "",
            paid: "",
            comment: "",
          }}
          validationSchema={AddSchema}
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
              name: labours.find(l => l.code === values.labourCode)?.name || "",
              jobId: jobs.find(j => j.jobName === values.jobName)?.jobId || "",
            });

            fetchData();
            resetForm();
            setSelectedLabour(null);
            setSelectedJob(null);
          }}
        >
          {({ values, setFieldValue, handleChange, handleSubmit, errors, touched }) => (
            <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row flex-wrap gap-2 lg:items-center">

              {/* LABOUR DROPDOWN */}
              <div ref={labourRef} className="relative inline-block w-full lg:w-auto">
                <input
                  placeholder="Search Labour Code / Name *"
                  value={
                    showLabourPopup
                      ? labourSearch
                      : values.name
                        ? `${values.labourCode} - ${values.name}`
                        : ""
                  }
                  onChange={(e) => {
                    setLabourSearch(e.target.value);
                    setShowLabourPopup(true);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLabourPopup(true);
                  }}
                  className={`border p-2 rounded w-full lg:min-w-78 bg-white ${
                    touched.labourCode && errors.labourCode ? "border-red-500" : ""
                  }`}
                />
                {touched.labourCode && errors.labourCode && (
                  <div className="text-red-500 text-xs mt-1">{String(errors.labourCode)}</div>
                )}

                {showLabourPopup && (
                  <div
                    className="absolute bg-white border shadow max-h-60 overflow-y-auto z-50 w-full rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filteredLabours.length > 0 ? (
                      filteredLabours.map((l) => (
                        <div
                          key={l.id}
                          className={`p-2 cursor-pointer hover:bg-blue-100 ${values.labourCode === l.code ? "bg-blue-500 text-white" : ""
                            }`}
                          onClick={() => {
                            setFieldValue("name", l.name);
                            setFieldValue("labourCode", l.code);
                            setFieldValue("price", l.rate || 0);

                            setLabourSearch(""); // reset search
                            setShowLabourPopup(false);
                          }}
                        >
                          {l.code} - {l.name} - {l.rate}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-gray-500">No results found</div>
                    )}
                  </div>
                )}
              </div>

              {/* JOB DROPDOWN */}
              <div ref={jobRef} className="relative inline-block w-full lg:w-auto">
                <input
                  placeholder="Search Job ID / Name *"
                  value={
                    showJobPopup
                      ? jobSearch
                      : values.jobName
                        ? `${values.jobCode} - ${values.jobName}`
                        : ""
                  }
                  onChange={(e) => {
                    setJobSearch(e.target.value);
                    setShowJobPopup(true);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowJobPopup(true);
                  }}
                  className={`border p-2 rounded w-full lg:min-w-62.5 bg-white ${
                    touched.jobName && errors.jobName ? "border-red-500" : ""
                  }`}
                />
                {touched.jobName && errors.jobName && (
                  <div className="text-red-500 text-xs mt-1">{String(errors.jobName)}</div>
                )}

                {showJobPopup && (
                  <div
                    className="absolute bg-white border shadow max-h-60 overflow-y-auto z-50 w-full rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filteredJobs.length > 0 ? (
                      filteredJobs.map((j) => (
                        <div
                          key={j.id}
                          className={`p-2 cursor-pointer hover:bg-blue-100 ${values.jobCode === j.jobId ? "bg-blue-500 text-white" : ""
                            }`}
                          onClick={() => {
                            setFieldValue("jobName", j.jobName);
                            setFieldValue("jobCode", j.jobId);

                            setJobSearch(""); // reset search
                            setShowJobPopup(false);
                          }}
                        >
                          {j.jobId} - {j.jobName}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-gray-500">No results found</div>
                    )}
                  </div>
                )}
              </div>

              {/* ROW 1: Hours and Price */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2">
                <input
                  name="hours"
                  value={values.hours || ""}
                  onChange={handleChange}
                  placeholder="Hours"
                  type="number"
                  className="border p-2 rounded flex-1 lg:w-24"
                />
                <input
                  name="price"
                  onChange={handleChange}
                  placeholder="Price"
                  value={values.price || ""}
                  type="number"
                  className="border p-2 rounded flex-1 lg:w-24"
                />
              </div>

              {/* ROW 2: Paid and Comment */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2">
                <input
                  name="paid"
                  onChange={handleChange}
                  placeholder="Paid"
                  value={values.paid || ""}
                  type="number"
                  className="border p-2 rounded flex-1 lg:w-24"
                />
                <input
                  name="comment"
                  onChange={handleChange}
                  placeholder="Comment"
                  value={values.comment || ""}
                  className="border p-2 rounded flex-1 lg:w-32"
                />
              </div>

              {/* SAVE BUTTON */}
              <button className="w-full lg:w-auto bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700">
                <Save size={16} /> Save
              </button>
            </form>
          )}
        </Formik>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded shadow mb-4 flex gap-2 flex-col lg:flex-row flex-wrap">
        <input placeholder="Labour Code / Name Search"
          onChange={(e) => setFilters({ ...filters, code: e.target.value })}
          className="border p-2 rounded flex-1 lg:flex-none" />

        <input placeholder="Job ID / Name Search"
          onChange={(e) => setFilters({ ...filters, job: e.target.value })}
          className="border p-2 rounded flex-1 lg:flex-none" />

        <input type="date"
          placeholder="Start Date"
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="border p-2 rounded flex-1 lg:flex-none" />

        <input type="date"
          placeholder="End Date"
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="border p-2 rounded flex-1 lg:flex-none" />
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <button
          onClick={() => setShowCodeTotals((prev) => !prev)}
          className="self-start bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          {showCodeTotals ? "Hide code totals" : "Show totals by code"}
        </button>

        {showCodeTotals && (
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Totals by Labour Code</h3>
            {groupedTotals.length === 0 ? (
              <p className="text-sm text-gray-500">No matching entries to summarize.</p>
            ) : (
              <div className="grid gap-3">
                {groupedTotals.map((group) => (
                  <div
                    key={group.code}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 border rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="text-xs text-gray-500">Code</p>
                      <p className="font-semibold">{group.code}</p>
                      {group.name && <p className="text-xs text-gray-500">{group.name}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="text-lg font-semibold text-blue-600">${group.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Paid</p>
                      <p className="text-lg font-semibold text-green-600">${group.totalPaid.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Remaining</p>
                      <p className="text-lg font-semibold text-red-600">${group.totalRemaining.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded shadow">
        <div className="grid grid-cols-10 bg-gray-200 p-3 font-semibold text-sm">
          <span>Date</span>
          <span>Code - Name</span>
          <span>Job Id - Name</span>
          <span>Hours</span>
          <span>Price</span>
          <span>Total Amount</span>
          <span>Paid</span>
          <span>Remaining</span>
          <span>Comment</span>
          <span>Actions</span>
        </div>

        {filteredData.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-10 p-3 border-t items-center text-sm"
          >
            <span>{item.date?.toDate?.().toLocaleDateString()}</span>
            <span>{item.code} - {item.name}</span>
            <span>{item.jobId} - {item.job}</span>
            <span>{item.hours}</span>
            <span>{item.price}</span>
            <span className="font-semibold">{item.amount || 0}</span>
            <span className="text-green-600">{item.paid || 0}</span>
            <span className="text-red-600 font-bold">
              {item.remaining ??
                (Number(item.amount || 0) - Number(item.paid || 0))}
            </span>
            <span className="truncate">{item.comment}</span>
            <div className="flex gap-2">
              <button onClick={() => openEdit(item)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                <Pencil size={18} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            <p>No entries found</p>
          </div>
        ) : (
          filteredData.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500"
            >
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Date</p>
                  <p className="text-sm font-semibold">{item.date?.toDate?.().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Labour</p>
                  <p className="text-sm font-semibold">{item.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Job ID</p>
                  <p className="text-sm font-semibold">{item.jobId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Hours</p>
                  <p className="text-sm font-semibold">{item.hours}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total</p>
                  <p className="text-sm font-bold text-blue-600">${item.amount || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Paid</p>
                  <p className="text-sm font-bold text-green-600">${item.paid || 0}</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-500 font-medium">Remaining</p>
                <p className="text-sm font-bold text-red-600">
                  ${item.remaining ??
                    (Number(item.amount || 0) - Number(item.paid || 0))}
                </p>
              </div>

              {item.comment && (
                <div className="mb-3 bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500 font-medium">Comment</p>
                  <p className="text-sm text-gray-700">{item.comment}</p>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => openEdit(item)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-blue-700"
                >
                  <Pencil size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-red-700"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editOpen && editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          {/* MODAL BOX */}
          <div className="bg-white rounded-xl shadow-2xl max-w-96 w-full max-h-[90vh] overflow-y-auto">

            {/* HEADER */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Edit Work Entry</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={24} />
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
                <Form onSubmit={handleSubmit} className="p-6 space-y-6">

                  {/* LABOUR SELECTION */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Labour *</label>
                    <select
                      name="code"
                      value={values.code}
                      onChange={(e) => {
                        handleChange(e);
                        const selected = labours.find((l) => l.code === e.target.value);
                        if (selected) {
                          setFieldValue("price", selected.rate || 0);
                        }
                      }}
                      className={`w-full border ${
                        touched.code && errors.code
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                    >
                      <option value="">Select Labour</option>
                      {labours.map((l) => (
                        <option key={l.id} value={l.code}>
                          {l.code} - {l.name}
                        </option>
                      ))}
                    </select>
                    {touched.code && errors.code && (
                      <div className="text-red-500 text-sm">{String(errors.code)}</div>
                    )}
                  </div>

                  {/* JOB SELECTION */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Job *</label>
                    <select
                      name="job"
                      value={values.job}
                      onChange={handleChange}
                      className={`w-full border ${
                        touched.job && errors.job
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors`}
                    >
                      <option value="">Select Job</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.jobName}>
                          {j.jobId} - {j.jobName}
                        </option>
                      ))}
                    </select>
                    {touched.job && errors.job && (
                      <div className="text-red-500 text-sm">{String(errors.job)}</div>
                    )}
                  </div>

                  {/* HOURS AND PRICE ROW */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Hours</label>
                      <input
                        name="hours"
                        type="number"
                        value={values.hours}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <input
                        name="price"
                        type="number"
                        value={values.price}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* PAID */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Paid Amount</label>
                    <input
                      name="paid"
                      type="number"
                      value={values.paid}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>

                  {/* COMMENT */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Comment</label>
                    <input
                      name="comment"
                      value={values.comment}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>

                  {/* TOTAL DISPLAY */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${Number(values.hours || 0) * Number(values.price || 0)}
                      </span>
                    </div>
                  </div>

                  {/* BUTTONS */}
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
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      Update Entry
                    </button>
                  </div>

                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

    </div>
  );
}



