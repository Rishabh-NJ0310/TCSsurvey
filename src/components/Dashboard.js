
// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
const [applications, setApplications] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
    const fetchApplications = async () => {
    try {
        const response = await axios.get('http://localhost:5000/api/applications');
        setApplications(response.data);
        setLoading(false);
    } catch (err) {
        setError('Error fetching applications');
        setLoading(false);
        console.error('Error fetching applications:', err);
    }
    };

    fetchApplications();
}, []);

const getStatusBadgeClass = (status) => {
    switch (status) {
    case 'draft':
        return 'bg-gray-200 text-gray-800';
    case 'submitted':
        return 'bg-blue-200 text-blue-800';
    case 'under-review':
        return 'bg-yellow-200 text-yellow-800';
    case 'approved':
        return 'bg-green-200 text-green-800';
    case 'rejected':
        return 'bg-red-200 text-red-800';
    default:
        return 'bg-gray-200 text-gray-800';
    }
};

if (loading) {
    return (
    <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
    </div>
    );
}

if (error) {
    return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>{error}</p>
    </div>
    );
}

return (
    <div>
    <h1 className="text-2xl font-bold mb-6">Loan Applications</h1>
    
    {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">No applications found.</p>
        <Link to="/new" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Create New Application
        </Link>
        </div>
    ) : (
        <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
            <tr className="bg-gray-200 text-gray-700">
                <th className="py-3 px-4 text-left">Applicant</th>
                <th className="py-3 px-4 text-left">Loan Amount</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">OCR Status</th>
                <th className="py-3 px-4 text-left">Created</th>
                <th className="py-3 px-4 text-left">Actions</th>
            </tr>
            </thead>
            <tbody>
            {applications.map((app) => (
                <tr key={app._id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">{app.applicantName || 'Unnamed'}</td>
                <td className="py-3 px-4">
                    {app.loanAmount ? `$${app.loanAmount.toLocaleString()}` : 'Not specified'}
                </td>
                <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(app.status)}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                </td>
                <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                    app.processingStatus === 'completed' ? 'bg-green-200 text-green-800' :
                    app.processingStatus === 'error' ? 'bg-red-200 text-red-800' :
                    app.processingStatus === 'processing' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                    }`}>
                    {app.processingStatus.charAt(0).toUpperCase() + app.processingStatus.slice(1)}
                    </span>
                </td>
                <td className="py-3 px-4">
                    {new Date(app.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                    <Link 
                    to={`/application/${app._id}`} 
                    className="text-blue-600 hover:text-blue-800"
                    >
                    View Details
                    </Link>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    )}
    </div>
);
};

export default Dashboard;
