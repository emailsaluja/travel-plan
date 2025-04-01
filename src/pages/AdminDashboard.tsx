import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useLocation } from 'react-router-dom';
import {
    Table,
    Users,
    Map,
    Hotel,
    FileText,
    Calendar,
    ChevronDown,
    Edit,
    Trash2,
    Plus,
    Save,
    X,
    Image
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface TableInfo {
    name: string;
    icon: React.ReactNode;
    description: string;
}

const TABLES: TableInfo[] = [
    {
        name: 'user_profiles',
        icon: <Users className="w-5 h-5" />,
        description: 'User profile information'
    },
    {
        name: 'user_itineraries',
        icon: <Map className="w-5 h-5" />,
        description: 'User created itineraries'
    },
    {
        name: 'user_itinerary_destinations',
        icon: <Calendar className="w-5 h-5" />,
        description: 'Destinations in user itineraries'
    },
    {
        name: 'user_itinerary_day_attractions',
        icon: <Map className="w-5 h-5" />,
        description: 'Daily attractions in itineraries'
    },
    {
        name: 'user_itinerary_day_hotels',
        icon: <Hotel className="w-5 h-5" />,
        description: 'Hotels in daily itineraries'
    },
    {
        name: 'user_itinerary_day_notes',
        icon: <FileText className="w-5 h-5" />,
        description: 'Notes for daily itineraries'
    }
];

const AdminDashboard = () => {
    const location = useLocation();
    const [selectedTable, setSelectedTable] = useState<string>('user_profiles');
    const [tableData, setTableData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRow, setEditingRow] = useState<any | null>(null);
    const [newRow, setNewRow] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTableData();
    }, [selectedTable]);

    const loadTableData = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from(selectedTable)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                setColumns(Object.keys(data[0]));
                setTableData(data);
            } else {
                setColumns([]);
                setTableData([]);
            }
        } catch (error: any) {
            setError(error.message);
            console.error('Error loading table data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (row: any) => {
        setEditingRow({ ...row });
    };

    const handleSave = async () => {
        try {
            setError(null);
            const { error } = await supabase
                .from(selectedTable)
                .update(editingRow)
                .eq('id', editingRow.id);

            if (error) throw error;

            await loadTableData();
            setEditingRow(null);
        } catch (error: any) {
            setError(error.message);
            console.error('Error saving data:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;

        try {
            setError(null);
            const { error } = await supabase
                .from(selectedTable)
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadTableData();
        } catch (error: any) {
            setError(error.message);
            console.error('Error deleting data:', error);
        }
    };

    const handleAdd = async () => {
        try {
            setError(null);
            let dataToInsert = { ...newRow };

            if (selectedTable === 'user_profiles') {
                // First create a user in auth.users
                const { data: authUser, error: signUpError } = await supabase.auth.signUp({
                    email: dataToInsert.username + '@example.com', // Using username as email
                    password: 'defaultPassword123', // You might want to generate this
                });

                if (signUpError) throw signUpError;

                if (authUser.user) {
                    // Use the new auth user's ID for the profile
                    dataToInsert.user_id = authUser.user.id;
                } else {
                    throw new Error('Failed to create auth user');
                }
            }

            const { error } = await supabase
                .from(selectedTable)
                .insert(dataToInsert);

            if (error) throw error;

            await loadTableData();
            setNewRow(null);
        } catch (error: any) {
            setError(error.message);
            console.error('Error adding data:', error);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 mt-[80px]">
            <div className="mb-8 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <Link
                        to="/admin"
                        className={`${location.pathname === '/admin'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Manage Data
                    </Link>
                    <Link
                        to="/admin/country-images"
                        className={`${location.pathname === '/admin/country-images'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Country Images
                    </Link>
                </nav>
            </div>

            {location.pathname === '/admin' && (
                <>
                    <div className="mb-6">
                        <label htmlFor="table-select" className="block text-sm font-medium text-gray-700 mb-2">
                            Select Table
                        </label>
                        <select
                            id="table-select"
                            value={selectedTable}
                            onChange={(e) => setSelectedTable(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            {TABLES.map((table) => (
                                <option key={table.name} value={table.name}>
                                    {table.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {columns.map((column) => (
                                                <th
                                                    key={column}
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    {column}
                                                </th>
                                            ))}
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {newRow && (
                                            <tr>
                                                {columns.map((column) => (
                                                    <td key={column} className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="text"
                                                            value={newRow[column] || ''}
                                                            onChange={(e) => setNewRow({ ...newRow, [column]: e.target.value })}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={handleAdd}
                                                        className="text-[#00C48C] hover:text-[#00B380] mr-3"
                                                    >
                                                        <Save className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setNewRow(null)}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                        {tableData.map((row) => (
                                            <tr key={row.id}>
                                                {columns.map((column) => (
                                                    <td key={column} className="px-6 py-4 whitespace-nowrap">
                                                        {editingRow?.id === row.id ? (
                                                            <input
                                                                type="text"
                                                                value={editingRow[column] || ''}
                                                                onChange={(e) => setEditingRow({ ...editingRow, [column]: e.target.value })}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-900">
                                                                {typeof row[column] === 'object' ? JSON.stringify(row[column]) : row[column]}
                                                            </span>
                                                        )}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {editingRow?.id === row.id ? (
                                                        <>
                                                            <button
                                                                onClick={handleSave}
                                                                className="text-[#00C48C] hover:text-[#00B380] mr-3"
                                                            >
                                                                <Save className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingRow(null)}
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(row)}
                                                                className="text-[#00C48C] hover:text-[#00B380] mr-3"
                                                            >
                                                                <Edit className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(row.id)}
                                                                className="text-red-500 hover:text-red-600"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {!loading && !newRow && (
                            <div className="p-4 border-t border-gray-200">
                                <button
                                    onClick={() => setNewRow({})}
                                    className="flex items-center gap-2 text-[#00C48C] hover:text-[#00B380]"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add New Record</span>
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard; 