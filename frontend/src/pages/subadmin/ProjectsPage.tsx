import React, { useEffect, useState } from "react";
import { projectService } from "@/services/projectService";
import { poolService } from "@/services/poolService";

const ProjectsPage = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPool, setSelectedPool] = useState("");

  // ✅ Load pool
  useEffect(() => {
    poolService.list().then((res) => {
      if (res.data?.length) {
        setSelectedPool(res.data[0].id);
      }
    });
  }, []);

  // ✅ Load projects
  useEffect(() => {
    if (!selectedPool) return;

    projectService.listByPool(selectedPool).then((res) => {
      console.log("PROJECT RESPONSE:", res);

      setProjects(res.data || res || []);
    });
  }, [selectedPool]);

  // ✅ Search filter
  const filtered = projects.filter((p) => {
    const projectTitle = p.title || p.projectTitle || p.name || "";

    return projectTitle.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ✅ Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Projects</h1>

        <p className="text-gray-500 mt-1">Manage and explore all projects</p>
      </div>

      {/* ✅ Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* ✅ Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-500 col-span-full">
            No projects found
          </div>
        ) : (
          filtered.map((p, i) => {
            const projectTitle =
              p.title || p.projectTitle || p.name || "Untitled Project";

            return (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition duration-300 border border-gray-100"
              >
                {/* Title */}
                <h2 className="text-xl font-bold text-gray-800 mb-3">
                  {projectTitle}
                </h2>

                {/* Description */}
                <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                  {p.description || "No project description available"}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4">
                  {/* Status */}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      p.status === "LOCKED"
                        ? "bg-green-100 text-green-700"
                        : p.status === "HOLD"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {p.status || "ACTIVE"}
                  </span>

                  {/* Faculty */}
                  <span className="text-sm text-gray-400">
                    {p.faculty?.name || p.createdBy?.name || "Faculty"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
