import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { poolService } from '@/services/poolService';
import { projectService } from '@/services/projectService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  ChevronDown,
  Search,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Pool, FacultyStatus } from '@/types';
import { getErrorMessage } from '@/types';

const FacultyPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const statusFilter = searchParams.get('status');

  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState('');
  const [facultyList, setFacultyList] = useState<FacultyStatus[]>([]);
  const [search, setSearch] = useState('');

  const [loadingPools, setLoadingPools] = useState(true);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  // ─────────────────────────────────────────────
  // Load pools assigned to the SubAdmin
  // ─────────────────────────────────────────────
  useEffect(() => {
    const loadPools = async () => {
      setLoadingPools(true);

      try {
        const response = await poolService.list();

        const assignedPools: Pool[] = response.data || [];

        setPools(assignedPools);

        if (assignedPools.length > 0) {
          setSelectedPool(assignedPools[0].id);
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoadingPools(false);
      }
    };

    loadPools();
  }, []);

  // ─────────────────────────────────────────────
  // Load faculty for selected pool
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedPool) {
      setFacultyList([]);
      return;
    }

    const loadFaculty = async () => {
      setLoadingFaculty(true);

      try {
        const response =
          await projectService.getFacultyStatus(selectedPool);

        setFacultyList(response || []);
      } catch (error: unknown) {
        setFacultyList([]);
        toast.error(getErrorMessage(error));
      } finally {
        setLoadingFaculty(false);
      }
    };

    loadFaculty();
  }, [selectedPool]);

  // ─────────────────────────────────────────────
  // Filter faculty
  // ─────────────────────────────────────────────
  const filteredFaculty = useMemo(() => {
    let result = [...facultyList];

    if (statusFilter === 'submitted') {
      result = result.filter(
        (faculty) => faculty.hasSubmitted
      );
    }

    if (statusFilter === 'pending') {
      result = result.filter(
        (faculty) => !faculty.hasSubmitted
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((faculty) => {
        const name =
          `${faculty.faculty.firstName} ${faculty.faculty.lastName}`
            .toLowerCase();

        const email =
          faculty.faculty.email?.toLowerCase() || '';

        return (
          name.includes(query) ||
          email.includes(query)
        );
      });
    }

    return result;
  }, [facultyList, statusFilter, search]);

  const selectedPoolData = pools.find(
    (pool) => pool.id === selectedPool
  );

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (loadingPools) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Users className="w-6 h-6 text-amber-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Faculty
              </h1>

              <p className="text-gray-500">
                Faculty assigned to your pools
              </p>
            </div>
          </div>
        </div>

        {/* Pool selector */}
        <div className="bg-white rounded-2xl border p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Pool
          </label>

          {pools.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 text-amber-700">
              No pools have been assigned to you.
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedPool}
                onChange={(event) =>
                  setSelectedPool(event.target.value)
                }
                className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-amber-400"
              >
                {pools.map((pool) => (
                  <option
                    key={pool.id}
                    value={pool.id}
                  >
                    {pool.name} — {pool.academicYear} —{' '}
                    {pool.semester}
                  </option>
                ))}
              </select>

              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Selected pool information */}
        {selectedPoolData && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-amber-700">
                  Current Pool
                </p>

                <h2 className="text-xl font-bold text-gray-800">
                  {selectedPoolData.name}
                </h2>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Faculty
                </p>

                <p className="text-2xl font-bold text-gray-800">
                  {facultyList.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-2xl border p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
              type="text"
              placeholder="Search faculty by name or email..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Faculty list */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          {loadingFaculty ? (
            <div className="p-10 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />

              <p className="font-medium">
                No faculty found
              </p>

              <p className="text-sm mt-1">
                No faculty matches the current filter.
              </p>
            </div>
          ) : (
            <div>
              {filteredFaculty.map((item) => (
                <div
                  key={item.facultyId}
                  className="flex items-center justify-between gap-4 p-5 border-b last:border-b-0 hover:bg-gray-50 transition"
                >
                  {/* Faculty information */}
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700">
                      {item.faculty.firstName?.[0]}
                      {item.faculty.lastName?.[0]}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-800">
                        {item.faculty.firstName}{' '}
                        {item.faculty.lastName}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.faculty.email}
                      </p>
                    </div>
                  </div>

                  {/* Submission status */}
                  <div>
                    {item.hasSubmitted ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FacultyPage;