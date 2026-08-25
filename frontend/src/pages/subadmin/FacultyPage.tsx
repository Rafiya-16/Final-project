import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { projectService } from "@/services/projectService";
import { poolService } from "@/services/poolService";

const FacultyPage = () => {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPool, setSelectedPool] = useState("");

  const location = useLocation();

  // ✅ Query params
  const params = new URLSearchParams(location.search);
  const status = params.get("status");

  // ✅ Load pools
  useEffect(() => {
    poolService.list().then((res) => {
      if (res.data?.length) {
        setSelectedPool(res.data[0].id);
      }
    });
  }, []);

  // ✅ Load faculty data
  useEffect(() => {
    if (!selectedPool) return;

    projectService.getFacultyStatus(selectedPool).then((res) => {
      console.log("FACULTY RESPONSE:", res);

      setFacultyList(res.data || res || []);
    });
  }, [selectedPool]);

  // ✅ Copy array
  let filtered = [...facultyList];

  // ✅ Submitted filter
  if (status === "submitted") {
    filtered = filtered.filter((f) => f.hasSubmitted === true);
  }

  // ✅ Pending filter
  if (status === "pending") {
    filtered = filtered.filter((f) => f.hasSubmitted === false);
  }

  // ✅ Search filter
  if (search.trim() !== "") {
    filtered = filtered.filter((f) => {
      const facultyName =
        f.name ||
        f.facultyName ||
        f.user?.name ||
        f.faculty?.name ||
        f.fullName ||
        "";

      return facultyName.toLowerCase().includes(search.toLowerCase());
    });
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ✅ Dynamic Heading */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {status === "submitted"
            ? "Submitted Faculty"
            : status === "pending"
              ? "Pending Faculty"
              : "All Faculty"}
        </h1>

        <p className="text-gray-500 mt-1">
          {status === "submitted"
            ? "Faculty who submitted projects"
            : status === "pending"
              ? "Faculty who have not submitted projects"
              : "Complete faculty list"}
        </p>
      </div>

      {/* ✅ Search */}
      <input
        type="text"
        placeholder="Search faculty..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-xl p-3 mb-6 outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* ✅ Faculty List */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {search.trim() === ""
              ? "Search faculty to see results"
              : "No faculty found"}
          </div>
        ) : (
          filtered.map((f, i) => {
            // ✅ Multiple fallback fields
            const facultyName =
              f.name ||
              f.facultyName ||
              f.user?.name ||
              f.faculty?.name ||
              f.fullName ||
              "Faculty";

            return (
              <div
                key={i}
                className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition"
              >
                {/* Faculty Name */}
                <div>
                  <p className="font-semibold text-gray-800">{facultyName}</p>
                </div>

                {/* Status */}
                <div>
                  {f.hasSubmitted ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      Submitted
                    </span>
                  ) : (
                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FacultyPage;
