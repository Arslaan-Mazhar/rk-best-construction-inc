import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full">

      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/construction6.jpg')",
        }}
      >
        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* TOP NAV */}
      <div className="relative z-10 flex items-center justify-end p-6">
        <Link
          href="/admin/login"
          className="text-white border border-white px-5 py-2 rounded-full hover:bg-white hover:text-black transition"
        >
          Login
        </Link>
      </div>

      {/* CENTER CONTENT */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <h1 className="text-center text-white text-4xl md:text-6xl font-bold tracking-wide">
          RK Best Construction Inc.
        </h1>
      </div>

    </div>
  );
}