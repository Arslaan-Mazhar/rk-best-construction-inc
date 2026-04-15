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
    name: "",
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
      name: item.name,
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
      <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-center">
          Labour Management
        </h1>

        <div className="hidden sm:block w-20" />
      </div>

      

      {/* FORM */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <HardHat size={18} /> Add New Labour </h2>

        <Formik
          initialValues={{ code: "", name: "", rate: "" }}
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
                className="border p-3 rounded-lg w-full md:w-1/4 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              />

              <input
                name="name"
                placeholder="Name"
                onChange={handleChange}
                className="border p-3 rounded-lg w-full md:w-1/4 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              />

              <input
                name="rate"
                placeholder="Rate"
                onChange={handleChange}
                className="border p-3 rounded-lg w-full md:w-1/4 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
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

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Labour List</h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-gray-500">No labours added yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-3 font-semibold">Code</th>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Rate</th>
                <th className="p-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">

                  {editingId === item.id ? (
                    <>
                      <td className="p-3">
                        <input
                          value={editValues.code}
                          onChange={(e) =>
                            setEditValues({ ...editValues, code: e.target.value })
                          }
                          className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>

                      <td className="p-3">
                        <input
                          value={editValues.name}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              name: e.target.value,
                            })
                          }
                          className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>

                      <td className="p-3">
                        <input
                          value={editValues.rate}
                          onChange={(e) =>
                            setEditValues({ ...editValues, rate: e.target.value })
                          }
                          className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>

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
                      <td className="p-3">{item.name}</td>
                      <td className="p-3">${item.rate}</td>

                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:scale-110 transition"
                          >
                            <Edit3 size={18} />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:scale-110 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Labour List</h2>

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading...</p>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            <p>No labours added yet</p>
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500"
            >
              {editingId === item.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
                    <input
                      value={editValues.code}
                      onChange={(e) =>
                        setEditValues({ ...editValues, code: e.target.value })
                      }
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                    <input
                      value={editValues.name}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          name: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rate</label>
                    <input
                      value={editValues.rate}
                      onChange={(e) =>
                        setEditValues({ ...editValues, rate: e.target.value })
                      }
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={handleUpdate}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-green-700"
                    >
                      <Check size={18} /> Save
                    </button>

                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-gray-400"
                    >
                      <X size={18} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Code</p>
                      <p className="text-sm font-bold text-gray-900">{item.code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Name</p>
                      <p className="text-sm font-bold text-gray-900">{item.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Rate</p>
                      <p className="text-sm font-bold text-blue-600">${item.rate}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-blue-700"
                    >
                      <Edit3 size={16} /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-red-700"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}