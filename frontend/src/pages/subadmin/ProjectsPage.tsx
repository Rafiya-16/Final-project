import React, {
  useEffect,
  useState,
} from 'react';

import { projectService } from '@/services/projectService';
import { poolService } from '@/services/poolService';

const ProjectsPage = () => {
  const [projects, setProjects] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState('');

  const [selectedPool, setSelectedPool] =
    useState('');

  /**
   * Load ONLY pools where the current
   * user has PoolSubadmin assignment.
   */
  useEffect(() => {
    let mounted = true;

    const loadPools = async () => {
      try {
        const response =
          await poolService.list(
            1,
            'subadmin'
          );

        const assignedPools =
          Array.isArray(response.data)
            ? response.data
            : [];

        if (!mounted) {
          return;
        }

        if (assignedPools.length > 0) {
          setSelectedPool(
            assignedPools[0].id
          );
        } else {
          setSelectedPool('');
        }
      } catch (error) {
        console.error(
          'Failed to load SubAdmin pools:',
          error
        );

        if (mounted) {
          setSelectedPool('');
        }
      }
    };

    loadPools();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Load projects from the selected
   * SubAdmin-assigned pool.
   */
  useEffect(() => {
    if (!selectedPool) {
      setProjects([]);
      return;
    }

    let mounted = true;

    const loadProjects = async () => {
      try {
        const response =
          await projectService.listByPool(
            selectedPool
          );

        if (!mounted) {
          return;
        }

        setProjects(
          Array.isArray(response)
            ? response
            : []
        );
      } catch (error) {
        console.error(
          'Failed to load projects:',
          error
        );

        if (mounted) {
          setProjects([]);
        }
      }
    };

    loadProjects();

    return () => {
      mounted = false;
    };
  }, [selectedPool]);

  const filtered =
    projects.filter((project) => {
      const projectTitle =
        project.title ||
        project.projectTitle ||
        project.name ||
        '';

      return projectTitle
        .toLowerCase()
        .includes(
          search.toLowerCase()
        );
    });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Projects
        </h1>

        <p className="text-gray-500 mt-1">
          Manage and explore projects
          from your assigned pools
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search project..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {selectedPool ? (
        <div className="mb-6 bg-white border rounded-xl px-4 py-3 text-sm text-gray-600">
          Showing projects from your
          assigned SubAdmin pool.
        </div>
      ) : (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          No pools have been assigned to
          you as SubAdmin.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-500 col-span-full">
            No projects found
          </div>
        ) : (
          filtered.map((project, index) => {
            const projectTitle =
              project.title ||
              project.projectTitle ||
              project.name ||
              'Untitled Project';

            return (
              <div
                key={
                  project.id || index
                }
                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition duration-300 border border-gray-100"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-3">
                  {projectTitle}
                </h2>

                <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                  {project.description ||
                    'No project description available'}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      project.status ===
                      'LOCKED'
                        ? 'bg-green-100 text-green-700'
                        : project.status ===
                          'ON_HOLD'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {project.status ||
                      'ACTIVE'}
                  </span>

                  <span className="text-sm text-gray-400">
                    {project.faculty?.name ||
                      project.createdBy?.name ||
                      'Faculty'}
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