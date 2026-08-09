import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const EditRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    budget_min: '',
    budget_max: '',
    pincode: '',
    category: 'electronics',
    reference_url: '',
    reference_image: ''
  });

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await api.get(`/requests/${id}`);
      const req = response.data;
      
      // Check if user owns this request
      if (req.buyer_id !== user?.user_id) {
        setError('You don\'t have permission to edit this request');
        setLoading(false);
        return;
      }
      
      // Check if request is open
      if (req.status !== 'open') {
        setError('Only open requests can be edited');
        setLoading(false);
        return;
      }
      
      setFormData({
        item_name: req.item_name || '',
        description: req.description || '',
        budget_min: req.budget_min || '',
        budget_max: req.budget_max || '',
        pincode: req.pincode || '',
        category: req.category || 'electronics',
        reference_url: req.reference_url || '',
        reference_image: req.reference_image || ''
      });
    } catch (err) {
      setError('Failed to fetch request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        item_name: formData.item_name,
        description: formData.description,
        budget_min: parseInt(formData.budget_min),
        budget_max: parseInt(formData.budget_max),
        pincode: formData.pincode,
        category: formData.category,
        reference_url: formData.reference_url || null,
        reference_image: formData.reference_image || null
      };

      await api.patch(`/requests/${id}`, payload);
      
      setSuccess('✅ Request updated successfully!');
      
      setTimeout(() => {
        navigate('/buyer/dashboard');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update request');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (error && !formData.item_name) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '50px auto', textAlign: 'center' }}>
        <h2 style={{ color: '#dc3545' }}>Error</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate('/buyer/dashboard')}
          style={{
            padding: '10px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Edit Request</h1>
        <button
          onClick={() => navigate('/buyer/dashboard')}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div style={{
          color: 'red',
          padding: '10px',
          border: '1px solid red',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          color: 'green',
          padding: '10px',
          border: '1px solid green',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Item Name *</label>
          <input
            type="text"
            name="item_name"
            value={formData.item_name}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Min Budget (₹) *</label>
            <input
              type="number"
              name="budget_min"
              value={formData.budget_min}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Max Budget (₹) *</label>
            <input
              type="number"
              name="budget_max"
              value={formData.budget_max}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Pincode *</label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            maxLength="6"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="furniture">Furniture</option>
            <option value="books">Books</option>
            <option value="vehicles">Vehicles</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reference URL</label>
          <input
            type="url"
            name="reference_url"
            value={formData.reference_url}
            onChange={handleChange}
            placeholder="https://example.com/product"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reference Image URL</label>
          <input
            type="url"
            name="reference_image"
            value={formData.reference_image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {submitting ? 'Updating...' : 'Update Request'}
        </button>
      </form>
    </div>
  );
};

export default EditRequest;