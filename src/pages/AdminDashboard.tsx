import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';
import {
    Table,
    Users,
    Map,
    Hotel,
    FileText,
    Calendar,
    ChevronDown,
    ChevronUp,
    Edit,
    Trash2,
    Plus,
    Save,
    X,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Info,
    RefreshCw
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

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
    // State
    const [selectedTable, setSelectedTable] = useState<string>('user_profiles');
    const [tableData, setTableData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRow, setEditingRow] = useState<any | null>(null);
    const [newRow, setNewRow] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [isAddingRow, setIsAddingRow] = useState(false);

    // Load data when table changes
    useEffect(() => {
        loadTableData();
    }, [selectedTable]);

    // Filter data when search term changes
    useEffect(() => {
        filterData();
    }, [searchTerm, tableData, sortConfig]);

    // Load table data from Supabase
    const loadTableData = async () => {
        try {
            setLoading(true);
            setError(null);
            setCurrentPage(1);
            setSortConfig(null);
            setSearchTerm('');

            const { data, error } = await supabase
                .from(selectedTable)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                setColumns(Object.keys(data[0]));
                setTableData(data);
                setTotalRows(data.length);
            } else {
                setColumns([]);
                setTableData([]);
                setTotalRows(0);
            }
        } catch (error: any) {
            setError(error.message);
            console.error('Error loading table data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort data
    const filterData = () => {
        let result = [...tableData];

        // Filter by search term
        if (searchTerm) {
            result = result.filter(row =>
                Object.values(row).some(value =>
                    String(value).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Sort data if sort config exists
        if (sortConfig) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        setFilteredData(result);
        setTotalRows(result.length);
    };

    // Request sort
    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Get sort direction
    const getSortDirection = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? 'asc' : 'desc';
    };

    // Handle editing a row
    const handleEdit = (row: any) => {
        setEditingRow({ ...row });
        setIsAddingRow(false);
    };

    // Handle saving edits
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

    // Handle deleting a row
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

    // Create a new row template
    const createEmptyRow = () => {
        const newEmptyRow: any = {};
        columns.forEach(column => {
            newEmptyRow[column] = '';
        });
        return newEmptyRow;
    };

    // Handle adding a new row
    const handleAddRow = () => {
        setNewRow(createEmptyRow());
        setIsAddingRow(true);
        setEditingRow(null);
    };

    // Handle saving a new row
    const handleSaveNew = async () => {
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
            setIsAddingRow(false);
        } catch (error: any) {
            setError(error.message);
            console.error('Error adding data:', error);
        }
    };

    // Calculate pagination
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    const pageCount = Math.ceil(totalRows / rowsPerPage);
    const canPreviousPage = currentPage > 1;
    const canNextPage = currentPage < pageCount;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Data Management Dashboard</h2>

                {/* Data management tools */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Table selector */}
                        <div>
                            <label htmlFor="table-select" className="block text-sm font-medium text-gray-700 mb-2">
                                Select Table
                            </label>
                            <div className="relative">
                                <select
                                    id="table-select"
                                    value={selectedTable}
                                    onChange={(e) => setSelectedTable(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    {TABLES.map((table) => (
                                        <option key={table.name} value={table.name}>
                                            {table.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                                Search
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search in all fields..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col justify-end">
                            <div className="flex space-x-3 mt-auto">
                                <button
                                    onClick={handleAddRow}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add New
                                </button>
                                <button
                                    onClick={loadTableData}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table description */}
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Info className="h-4 w-4 mr-2" />
                        <span>
                            {TABLES.find(t => t.name === selectedTable)?.description || 'Select a table to manage data'}
                        </span>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {/* Data table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
                            </div>
                        ) : (
                            <>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {columns.map((column) => (
                                                <th
                                                    key={column}
                                                    className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                    onClick={() => requestSort(column)}
                                                >
                                                    <div className="flex items-center">
                                                        {column}
                                                        <span className="ml-2">
                                                            {getSortDirection(column) === 'asc' ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : getSortDirection(column) === 'desc' ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <div className="opacity-0 group-hover:opacity-50 h-4 w-4">
                                                                    <ChevronUp className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                        </span>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {/* New row form */}
                                        {isAddingRow && newRow && (
                                            <tr className="bg-indigo-50">
                                                {columns.map((column) => (
                                                    <td key={column} className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="text"
                                                            value={newRow[column] || ''}
                                                            onChange={(e) => setNewRow({ ...newRow, [column]: e.target.value })}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                                            placeholder={column}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={handleSaveNew}
                                                        className="text-green-600 hover:text-green-900 mr-3"
                                                    >
                                                        <Save className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setNewRow(null);
                                                            setIsAddingRow(false);
                                                        }}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )}

                                        {/* Data rows */}
                                        {paginatedData.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50">
                                                {columns.map((column) => (
                                                    <td key={column} className="px-6 py-4 whitespace-nowrap">
                                                        {editingRow && editingRow.id === row.id ? (
                                                            <input
                                                                type="text"
                                                                value={editingRow[column] || ''}
                                                                onChange={(e) => setEditingRow({ ...editingRow, [column]: e.target.value })}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                                            />
                                                        ) : (
                                                            <div className={column === 'id' ? 'font-mono text-xs' : ''}>
                                                                {row[column] !== null && typeof row[column] === 'object'
                                                                    ? JSON.stringify(row[column])
                                                                    : String(row[column] || '')}
                                                            </div>
                                                        )}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {editingRow && editingRow.id === row.id ? (
                                                        <>
                                                            <button
                                                                onClick={handleSave}
                                                                className="text-green-600 hover:text-green-900 mr-3"
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
                                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                            >
                                                                <Edit className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(row.id)}
                                                                className="text-red-600 hover:text-red-900"
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

                                {/* Empty state */}
                                {filteredData.length === 0 && (
                                    <div className="py-8 text-center text-gray-500">
                                        {tableData.length === 0 ? 'No data found in this table' : 'No results match your search criteria'}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && filteredData.length > 0 && (
                        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                            <div className="flex items-center">
                                <span className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * rowsPerPage, totalRows)}
                                    </span> of <span className="font-medium">{totalRows}</span> results
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <select
                                    value={rowsPerPage}
                                    onChange={e => setRowsPerPage(Number(e.target.value))}
                                    className="border border-gray-300 rounded-md text-sm py-1"
                                >
                                    {[10, 25, 50, 100].map(pageSize => (
                                        <option key={pageSize} value={pageSize}>
                                            Show {pageSize}
                                        </option>
                                    ))}
                                </select>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        disabled={!canPreviousPage}
                                        className={`inline-flex items-center px-2 py-1 rounded-l-md border text-sm font-medium ${canPreviousPage
                                                ? 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    {/* Page numbers */}
                                    {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                                        let pageNumber;
                                        if (pageCount <= 5) {
                                            pageNumber = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNumber = i + 1;
                                        } else if (currentPage >= pageCount - 2) {
                                            pageNumber = pageCount - 4 + i;
                                        } else {
                                            pageNumber = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => setCurrentPage(pageNumber)}
                                                className={`inline-flex items-center px-3 py-1 border text-sm font-medium ${currentPage === pageNumber
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600 z-10'
                                                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={!canNextPage}
                                        className={`inline-flex items-center px-2 py-1 rounded-r-md border text-sm font-medium ${canNextPage
                                                ? 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard; 