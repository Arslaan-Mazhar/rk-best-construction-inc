"use client";
import { Formik } from "formik";
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
import { useEffect, useState } from "react";
import { Trash2, Edit3, Save, ArrowLeft, Check, X, HardHat } from "lucide-react";

export default function Labours() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editValues, setEditValues] = useState({
    code: "",
    labourName: "",
    rate: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "labours"));
    setData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this labour?")) return;
    await deleteDoc(doc(db, "labours", id));
    fetchData();
  };

  // START EDIT
  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditValues({
      code: item.code,
      labourName: item.labourName,
      rate: item.rate,
    });
  };

  // UPDATE
  const handleUpdate = async () => {
    if (!editingId) return;

    await updateDoc(doc(db, "labours", editingId), editValues);

    setEditingId(null);
    fetchData();
  };

  // CANCEL
  const handleCancel = () => {
    setEditingId(null);
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
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-center flex-1">
          Labour Management
        </h1>

        <div className="w-20" />
      </div>

      

      {/* FORM */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <HardHat size={18} /> Add New Labour </h2>

        <Formik
          initialValues={{ code: "", labourName: "", rate: "" }}
          onSubmit={async (values, { resetForm }) => {
            await addDoc(collection(db, "labours"), values);
            fetchData();
            resetForm();
          }}
        >
          {({ handleChange, handleSubmit }) => (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row items-center gap-3"
            >
              {/* INPUTS INLINE */}
              <input
                name="code"
                placeholder="Code"
                onChange={handleChange}
                className="border p-3 rounded-lg w-full md:w-1/4"
              />

              <input
                name="labourName"
                placeholder="Name"
                onChange={handleChange}
                className="border p-3 rounded-lg w-full md:w-1/4"
              />

              <input
                name="rate"
                placeholder="Rate"
                onChange={handleChange}
                className="border p-3 rounded-lg w-full md:w-1/4"
              />

              {/* SAVE BUTTON INLINE */}
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg w-full md:w-auto hover:bg-gray-800 transition"
              >
                <Save size={18} />
                Save
              </button>
            </form>
          )}
        </Formik>
      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Labour List</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-3">Code</th>
                <th className="p-3">Name</th>
                <th className="p-3">Rate</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b">

                  {editingId === item.id ? (
                    <>
                      <td className="p-3">
                        <input
                          value={editValues.code}
                          onChange={(e) =>
                            setEditValues({ ...editValues, code: e.target.value })
                          }
                          className="border p-2 w-full"
                        />
                      </td>

                      <td className="p-3">
                        <input
                          value={editValues.labourName}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              labourName: e.target.value,
                            })
                          }
                          className="border p-2 w-full"
                        />
                      </td>

                      <td className="p-3">
                        <input
                          value={editValues.rate}
                          onChange={(e) =>
                            setEditValues({ ...editValues, rate: e.target.value })
                          }
                          className="border p-2 w-full"
                        />
                      </td>

                      {/* UPDATE + CANCEL ICON BUTTONS */}
                      <td className="p-3 flex justify-center gap-4">

                        <button
                          onClick={handleUpdate}
                          className="text-green-600 hover:scale-110 transition"
                        >
                          <Check size={20} />
                        </button>

                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:scale-110 transition"
                        >
                          <X size={20} />
                        </button>

                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3">{item.code}</td>
                      <td className="p-3">{item.labourName}</td>
                      <td className="p-3">{item.rate}</td>

                      <td className="p-3 flex justify-center gap-4">

                        {/* EDIT ICON */}
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:scale-110 transition"
                        >
                          <Edit3 size={18} />
                        </button>

                        {/* DELETE ICON */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:scale-110 transition"
                        >
                          <Trash2 size={18} />
                        </button>

                      </td>
                    </>
                  )}

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}