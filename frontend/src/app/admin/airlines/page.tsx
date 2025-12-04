'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Airline {
    id: number;
    name: string;
    code: string;
}

export default function AirlinesPage() {
    const [airlines, setAirlines] = useState<Airline[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAirlines();
    }, []);

    const fetchAirlines = async () => {
        try {
            const response = await api.get('/airlines');
            setAirlines(response.data);
        } catch (error) {
            console.error('Failed to fetch airlines', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this airline?')) return;
        try {
            await api.delete(`/airlines/${id}`);
            setAirlines(airlines.filter((airline) => airline.id !== id));
        } catch (error) {
            console.error('Failed to delete airline', error);
            alert('Failed to delete airline');
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">Airlines</h1>
                <Link
                    href="/admin/airlines/create"
                    className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                >
                    Add Airline
                </Link>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-md">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                Code
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                Name
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {airlines.map((airline) => (
                            <tr key={airline.id}>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
                                    <p className="whitespace-no-wrap text-gray-900">{airline.code}</p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
                                    <p className="whitespace-no-wrap text-gray-900">{airline.name}</p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/admin/airlines/${airline.id}/edit`}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(airline.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
