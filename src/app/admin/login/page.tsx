"use client";

import { useEffect } from "react";
import { Formik } from "formik";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/../lib/firebase";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";

export default function AdminLogin() {
  const router = useRouter();

  useEffect(() => {
    console.log("Login page auth ready:", auth);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Admin Login
        </h2>

        <Formik
          initialValues={{ email: "", password: "" }}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const userCredential = await signInWithEmailAndPassword(
                auth,
                values.email,
                values.password
              );

              const token = await userCredential.user.getIdToken();

              setCookie("token", token, { path: "/" });

              router.push("/admin/dashboard");
            } catch (err: any) {
              console.log("LOGIN ERROR:", err);
              alert(err.message);
            }

            setSubmitting(false);
          }}
        >
          {({ handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Email"
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />

              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded-lg"
              >
                Login
              </button>
            </form>
          )}
        </Formik>
      </div>
    </div>
  );
}