import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Image as ImageIcon, X } from 'lucide-react';

const AuctionForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

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
          // Adjust to local time string format for input
          date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
          const formattedDate = date.toISOString().slice(0, 16);

          setFormData({
            title: auction.title,
            description: auction.description,
            category: auction.category,
            startingPrice: auction.startingPrice,
            minBidIncrement: auction.minBidIncrement,
            endTime: formattedDate,
          });
          
          setExistingImages(auction.images || []);
        } catch (err) {
          showToast('Failed to fetch auction details', 'error');
          navigate('/seller/dashboard');
        } finally {
          setLoading(false);
        }
      };
      fetchAuction();
    }
  }, [isEdit, id, navigate, showToast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check max files (5)
    if (images.length + files.length + existingImages.length > 5) {
      showToast('Maximum 5 images allowed', 'warning');
      return;
    }

    setImages([...images, ...files]);
    
    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeNewImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create FormData to handle file uploads
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      // Append new images
      images.forEach(image => {
        data.append('images', image);
      });

      if (isEdit) {
        // Backend doesn't fully support updating images array out of the box in this boilerplate,
        // but we send the form data anyway.
        await api.put(`/auctions/${id}`, formData); // Just update text details for now on edit
        showToast('Auction updated successfully', 'success');
      } else {
        await api.post('/auctions', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Auction created successfully', 'success');
      }
      navigate('/seller/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Auction' : 'Create New Auction'}</h1>
        <p className="text-gray-500 mt-1">{isEdit ? 'Update your listing details' : 'List a new item for bidding'}</p>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Images Section */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Images (Max 5)</label>
              <div className="flex flex-wrap gap-4">
                {/* Existing Previews (if any) */}
                {existingImages.map((img, idx) => (
                  <div key={`existing-${idx}`} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ))}
                
                {/* New Previews */}
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {/* Add Image Button */}
                {(images.length + existingImages.length) < 5 && (
                  <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-primary-500 hover:text-primary-500 transition">
                    <ImageIcon size={24} className="mb-1" />
                    <span className="text-xs font-medium">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="E.g. Vintage Rolex Submariner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition resize-y"
                placeholder="Describe the item in detail..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price ($)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="startingPrice"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  required
                  min="1"
                  disabled={isEdit}
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Bid Increment ($)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="minBidIncrement"
                  value={formData.minBidIncrement}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="10.00"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-4 border-t mt-8">
            <button
              type="button"
              onClick={() => navigate('/seller/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition flex-[2] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuctionForm;

