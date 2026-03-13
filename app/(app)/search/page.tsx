"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const SPECIALTIES = [
  { value: "", label: "All Specialties" },
  { value: "General Dentistry", label: "General Dentistry" },
  { value: "Orthodontics", label: "Orthodontics" },
  { value: "Periodontics", label: "Periodontics" },
  { value: "Endodontics", label: "Endodontics" },
  { value: "Oral Surgery", label: "Oral Surgery" },
  { value: "Pediatric Dentistry", label: "Pediatric Dentistry" },
  { value: "Cosmetic Dentistry", label: "Cosmetic Dentistry" },
  { value: "Prosthodontics", label: "Prosthodontics" },
];

interface Dentist {
  id: string;
  firstName: string;
  lastName: string;
  specialties: string[];
  yearsExperience?: number;
  rating?: number;
  acceptingNewPatients: boolean;
  clinic?: {
    id: string;
    name: string;
    city: string;
    state: string;
    address: string;
  };
}

interface SearchResult {
  dentists: Dentist[];
  total: number;
  page: number;
  pageSize: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const search = useCallback(async (pg = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    if (specialty) params.set("specialty", specialty);
    params.set("page", pg.toString());
    params.set("accepting", "true");

    try {
      const res = await fetch(`/api/dentists?${params}`);
      const data = await res.json();
      setResults(data);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  }, [query, city, specialty]);

  useEffect(() => {
    search(1);
  }, [search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(1);
  };

  const totalPages = results ? Math.ceil(results.total / results.pageSize) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0d1b2a]">Find a Dentist</h1>
        <p className="text-gray-500 mt-1">Search by name, city, or specialty</p>
      </div>

      {/* Search filters */}
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search by name or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="sm:w-48">
            <Input
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="sm:w-56">
            <Select
              options={SPECIALTIES}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="h-11"
              placeholder="All Specialties"
            />
          </div>
          <Button
            type="submit"
            className="bg-teal-500 hover:bg-teal-600 text-white border-0 h-11 px-6"
            loading={loading}
          >
            Search
          </Button>
        </div>
      </form>

      {/* Results */}
      {loading && !results && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {results && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {results.total} dentist{results.total !== 1 ? "s" : ""} found
          </p>

          {results.dentists.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-4xl">🔍</span>
              <p className="mt-4 text-gray-500">No dentists found. Try adjusting your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.dentists.map((dentist) => (
                <DentistCard key={dentist.id} dentist={dentist} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => search(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => search(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DentistCard({ dentist }: { dentist: Dentist }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#0d1b2a] truncate">Dr. {dentist.firstName} {dentist.lastName}</h3>
            {dentist.clinic && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">
                {dentist.clinic.name} — {dentist.clinic.city}, {dentist.clinic.state}
              </p>
            )}
          </div>
          {dentist.rating && (
            <div className="flex items-center gap-1 ml-2 shrink-0">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-sm font-medium">{dentist.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {dentist.specialties.slice(0, 3).map((s) => (
            <Badge key={s} variant="info">{s}</Badge>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {dentist.acceptingNewPatients ? (
              <Badge variant="success">Accepting patients</Badge>
            ) : (
              <Badge variant="warning">Not accepting</Badge>
            )}
            {dentist.yearsExperience && (
              <span className="text-xs text-gray-500">{dentist.yearsExperience}y exp.</span>
            )}
          </div>
          <Link href={`/dentists/${dentist.id}`}>
            <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white border-0">
              Book
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
