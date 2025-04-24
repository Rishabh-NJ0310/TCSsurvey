
// src/components/NewApplication.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NewApplication = () => {
const navigate = useNavigate();
const [formData, setFormData] = useState({
    applicantName: '',
    address: {
    street: '',
    city: '',
    state: '',
    zipCode: ''
    },
    incomeDetails: {
    monthlyIncome: '',
    employerName: '',
    employmentDuration: ''
    },
    loanAmount: ''
});

const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
    const [parent, child] = name.split('.');
    setFormData(prev => ({
        ...prev,
        [parent]: {
        ...prev[parent],
        [child]: value
        }
    }));
    } else {
    setFormData(prev => ({
        ...prev,
        [name]: value
    }));
    }
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
    // Convert numeric fields to numbers
    const dataToSubmit = {
        ...formData,
        incomeDetails: {
        ...formData.incomeDetails,
        monthlyIncome: parseFloat(formData.incomeDetails.monthlyIncome),
        employmentDuration: parseInt(formData.incomeDetails.employmentDuration, 10)
        },
        loanAmount: parseFloat(formData.loanAmount)
    };
    
    const response = await axios.post('http://localhost:5000/api/applications', dataToSubmit);
    navigate(`/application/${response.data._id}`);
    } catch (err) {
    setError('Failed to create application. Please try again.');
    console.error('Error creating application:', err);
    } finally {
    setLoading(false);
    }
};

return (
    <div className="max-w-2xl mx-auto">
    <h1 className="text-2xl font-bold mb-6">New Loan Application</h1>
    
    {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>{error}</p>
        </div>
    )}
    
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Applicant Information</h2>
        <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="applicantName">
            Full Name
            </label>
            <input
            type="text"
            id="applicantName"
            name="applicantName"
            value={formData.applicantName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            />
        </div>
        </div>
        
        <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Address</h2>
        <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="address.street">
            Street Address
            </label>
            <input
            type="text"
            id="address.street"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="address.city">
                City
            </label>
            <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            />
            </div>
            
            <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="address.state">
                State
            </label>
            <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            />
            </div>
        </div>
        
        <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="address.zipCode">
            ZIP Code
            </label>
            <input
            type="text"
            id="address.zipCode"
            name="address.zipCode"
            value={formData.address.zipCode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required 
            />
        </div>
        </div>
        
        <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Income Details</h2>
        <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="incomeDetails.monthlyIncome">
            Monthly Income ($)
            </label>
            <input
            type="number"
            id="incomeDetails.monthlyIncome"
            name="incomeDetails.monthlyIncome"
            value={formData.incomeDetails.monthlyIncome}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            min="0"
            step="0.01"
            />
        </div>
        
        <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="incomeDetails.employerName">
            Employer Name
            </label>
            <input
            type="text"
            id="incomeDetails.employerName"
            name="incomeDetails.employerName"
            value={formData.incomeDetails.employerName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            />
        </div>
        
        <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="incomeDetails.employmentDuration">
            Employment Duration (months)
            </label>
            <input
            type="number"
            id="incomeDetails.employmentDuration"
            name="incomeDetails.employmentDuration"
            value={formData.incomeDetails.employmentDuration}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            min="0"
            step="1"
            />
        </div>
        </div>
        
        <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Loan Information</h2>
        <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="loanAmount">
            Loan Amount ($)
            </label>
            <input
            type="number"
            id="loanAmount"
            name="loanAmount"
            value={formData.loanAmount}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            min="0"
            step="0.01"
            />
        </div>
        </div>
        
        <div className="flex justify-end gap-4">
        <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
            Cancel
        </button>
        
        <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={loading}
        >
            {loading ? 'Creating...' : 'Create Application'}
        </button>
        </div>
    </form>
    </div>
);
};

export default NewApplication;
