import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

const AuctionForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startingPrice: '',
    minBidIncrement: '',
    endTime: '',
  });

  const categories = ['Electronics', 'Vehicles', 'Art', 'Collectibles', 'Fashion', 'Other'];

  useEffect(() => {
    if (isEdit && id) {
      const fetchAuction = async () => {
        try {
          const res = await api.get(`/auctions/${id}`);
          const auction = res.data.data;
          
          // Format date for datetime-local input
          const date = new Date(auction.endTime);
          const formattedDate = date.toISOString().slice(0, 16);

          setFormData({
            title: auction.title,
            description: auction.description,
            category: auction.category,
            startingPrice: auction.startingPrice,
            minBidIncrement: auction.minBidIncrement,
            endTime: formattedDate,
          });
        } catch (err) {
          setError('Failed to fetch auction details');
        } finally {
          setLoading(false);
        }
      };
      fetchAuction();
    }
  }, [isEdit, id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        await api.put(`/auctions/${id}`, formData);
      } else {
        await api.post('/auctions', formData); // Image upload can be added here with FormData if required
      }
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Auction' : 'Create New Auction'}</h1>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="5"
            className="w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price ($)</label>
            <input
              type="number"
              name="startingPrice"
              value={formData.startingPrice}
              onChange={handleChange}
              required
              min="1"
              disabled={isEdit} // usually shouldn't change starting price if edit
              className="w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Bid Increment ($)</label>
            <input
              type="number"
              name="minBidIncrement"
              value={formData.minBidIncrement}
              onChange={handleChange}
              required
              min="1"
              className="w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input
            type="datetime-local"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
            className="w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="pt-4 flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/seller/dashboard')}
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex-1 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Auction'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuctionForm;
