import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Filter, AlertTriangle, 
  AlertCircle, ShoppingCart, DollarSign, Package, 
  TrendingUp, RefreshCw, LogOut, X, Loader2 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

const AdminDashboard = ({ user, token, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentProductId, setCurrentProductId] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('Food Products');
  const [formQuantity, setFormQuantity] = useState(0);
  const [formPrice, setFormPrice] = useState(0);
  const [formMinStock, setFormMinStock] = useState(5);
  const [formDesc, setFormDesc] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch Stats
      const statsRes = await fetch(`${API_URL}/stats`, { headers });
      if (!statsRes.ok) throw new Error('Failed to load dashboard stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch Products
      const productsRes = await fetch(`${API_URL}/products`, { headers });
      if (!productsRes.ok) throw new Error('Failed to load products list');
      const productsData = await productsRes.json();
      setProducts(productsData);

      // Fetch Transactions
      const transRes = await fetch(`${API_URL}/transactions`, { headers });
      if (!transRes.ok) throw new Error('Failed to load transaction logs');
      const transData = await transRes.json();
      setTransactions(transData);

    } catch (err) {
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to delete product');
      }
      fetchData(); // Refresh
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setCurrentProductId(null);
    setFormName('');
    setFormSku('CHJ-' + Math.floor(1000 + Math.random() * 9000));
    setFormCategory('Food Products');
    setFormQuantity(0);
    setFormPrice(0);
    setFormMinStock(5);
    setFormDesc('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setModalMode('edit');
    setCurrentProductId(product._id);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormCategory(product.category);
    setFormQuantity(product.quantity);
    setFormPrice(product.price);
    setFormMinStock(product.minStockLevel);
    setFormDesc(product.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    const payload = {
      name: formName,
      sku: formSku,
      category: formCategory,
      quantity: Number(formQuantity),
      price: Number(formPrice),
      minStockLevel: Number(formMinStock),
      description: formDesc
    };

    const endpoint = modalMode === 'add' ? `${API_URL}/products` : `${API_URL}/products/${currentProductId}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save product');
      }

      setIsModalOpen(false);
      fetchData(); // Reload stats and logs
    } catch (err) {
      setFormError(err.message || 'Server error saving product');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'Low Stock') {
      matchesStock = p.quantity > 0 && p.quantity <= p.minStockLevel;
    } else if (stockFilter === 'Out of Stock') {
      matchesStock = p.quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Prepare chart data
  const pieChartData = stats?.categories?.map(c => ({
    name: c.category,
    value: c.stock
  })) || [];

  const barChartData = stats?.categories?.map(c => ({
    name: c.category,
    value: parseFloat(c.value.toFixed(2))
  })) || [];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">C</div>
          <span className="brand-name">Chijandas</span>
        </div>
        
        <ul className="nav-list">
          <li className="nav-item active">
            <Package size={18} />
            <span>Dashboard</span>
          </li>
          <li className="nav-item" onClick={() => handleOpenAddModal()}>
            <Plus size={18} />
            <span>Add Product</span>
          </li>
          <li className="nav-item" onClick={fetchData}>
            <RefreshCw size={18} />
            <span>Reload Data</span>
          </li>
        </ul>

        <div className="user-profile-section">
          <div className="user-profile-info">
            <div className="user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-display-name">{user.username}</span>
              <span className="user-role-badge">{user.role}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-ghost" onClick={onLogout} style={{ justifyContent: 'flex-start' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Panel */}
      <main className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Admin Control Center</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Real-time statistics & grocery mall catalog management</p>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            Add New Product
          </button>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: 0 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading && !stats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <Loader2 size={36} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            <p>Loading grocery mall telemetry data...</p>
          </div>
        ) : (
          <>
            {/* Stats Metrics Grid */}
            <div className="stats-grid">
              <div className="glass-card stat-card info">
                <div className="stat-header">
                  <span className="stat-title">Total SKUs</span>
                  <Package size={18} className="stat-icon" />
                </div>
                <div className="stat-value">{stats?.summary?.totalProducts || 0}</div>
                <div className="stat-desc">Distinct catalog items</div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Inventory Value</span>
                  <DollarSign size={18} className="stat-icon" />
                </div>
                <div className="stat-value">${stats?.summary?.totalValue?.toLocaleString() || '0.00'}</div>
                <div className="stat-desc">Stock value combined</div>
              </div>

              <div className="glass-card stat-card warning">
                <div className="stat-header">
                  <span className="stat-title">Low Stock</span>
                  <AlertTriangle size={18} className="stat-icon" />
                </div>
                <div className="stat-value">{stats?.summary?.lowStockCount || 0}</div>
                <div className="stat-desc">Stock &le; threshold limits</div>
              </div>

              <div className="glass-card stat-card danger">
                <div className="stat-header">
                  <span className="stat-title">Out of Stock</span>
                  <AlertCircle size={18} className="stat-icon" />
                </div>
                <div className="stat-value">{stats?.summary?.outOfStockCount || 0}</div>
                <div className="stat-desc">Requires immediate reorder</div>
              </div>

              <div className="glass-card stat-card success">
                <div className="stat-header">
                  <span className="stat-title">Total Orders</span>
                  <ShoppingCart size={18} className="stat-icon" />
                </div>
                <div className="stat-value">{stats?.summary?.totalOrdersCount || 0}</div>
                <div className="stat-desc">Total sales volume (${stats?.summary?.totalSalesValue || '0.00'})</div>
              </div>
            </div>

            {/* Recharts Analytics Section */}
            <div className="charts-grid">
              <div className="glass-card">
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                  Inventory Value by Category ($)
                </h3>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#243042" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: '#fff' }}
                        formatter={(value) => [`$${value}`, 'Valuation']}
                      />
                      <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card">
                <h3 style={{ marginBottom: '20px' }}>Category Quantity Split</h3>
                <div style={{ width: '100%', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} units`, 'Stock']} />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No stock data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Catalog Manager Table */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <h3>Catalog Products Manager</h3>
                <div className="filter-bar" style={{ marginBottom: 0 }}>
                  <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input 
                      type="text" 
                      className="form-input search-input" 
                      placeholder="Search name or SKU..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <select 
                    className="form-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ paddingRight: '36px', height: '45px' }}
                  >
                    <option value="All">All Categories</option>
                    <option value="Food Products">Food Products</option>
                    <option value="Kitchen Products">Kitchen Products</option>
                  </select>

                  <select 
                    className="form-select"
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    style={{ paddingRight: '36px', height: '45px' }}
                  >
                    <option value="All">All Stock Levels</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                          No products match the criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(product => {
                        const isOut = product.quantity === 0;
                        const isLow = !isOut && product.quantity <= product.minStockLevel;
                        
                        return (
                          <tr key={product._id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                              {product.sku}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#ffffff' }}>{product.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {product.description || 'No description'}
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-info">{product.category}</span>
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              ${product.price.toFixed(2)}
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              {product.quantity}
                            </td>
                            <td>
                              {isOut ? (
                                <span className="badge badge-danger">Out of Stock</span>
                              ) : isLow ? (
                                <span className="badge badge-warning">Low Stock</span>
                              ) : (
                                <span className="badge badge-success">Good</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => handleOpenEditModal(product)}>
                                  <Edit2 size={13} />
                                </button>
                                <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDelete(product._id)}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Orders Table */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} style={{ color: 'var(--primary)' }} />
                Customer Orders & Purchases
              </h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Customer Name</th>
                      <th>Product Ordered</th>
                      <th>Quantity</th>
                      <th>Total Price</th>
                      <th>Shipping Address</th>
                      <th>Payment Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.filter(t => t.type === 'order').length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                          No customer orders have been placed yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.filter(t => t.type === 'order').map(t => {
                        const date = new Date(t.timestamp).toLocaleString();
                        return (
                          <tr key={t._id}>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{date}</td>
                            <td style={{ fontWeight: 600, color: '#ffffff' }}>{t.userName}</td>
                            <td style={{ fontWeight: 500 }}>
                              {t.productName} 
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}> (at ${t.price.toFixed(2)}/ea)</span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{t.quantity}</td>
                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                              ${(t.quantity * t.price).toFixed(2)}
                            </td>
                            <td style={{ fontSize: '13px', whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '200px' }}>
                              {t.shippingAddress || 'N/A'}
                            </td>
                            <td>
                              <span className={`badge ${t.paymentMethod === 'UPI' ? 'badge-info' : 'badge-warning'}`}>
                                {t.paymentMethod || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Transaction Logs */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '16px' }}>Catalog Audit / Transaction Logs</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Product</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                          No transaction records found.
                        </td>
                      </tr>
                    ) : (
                      transactions.slice(0, 10).map(t => {
                        const date = new Date(t.timestamp).toLocaleString();
                        const isOrder = t.type === 'order';
                        const isRestock = t.type === 'in';
                        
                        return (
                          <tr key={t._id}>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{date}</td>
                            <td style={{ fontWeight: 500, color: '#ffffff' }}>{t.productName}</td>
                            <td>{t.userName}</td>
                            <td>
                              {isOrder ? (
                                <span className="badge badge-success">Customer Order</span>
                              ) : isRestock ? (
                                <span className="badge badge-info">Restock In</span>
                              ) : (
                                <span className="badge badge-danger">Write-off Out</span>
                              )}
                            </td>
                            <td style={{ fontWeight: 600 }}>{t.quantity}</td>
                            <td>${t.price.toFixed(2)}</td>
                            <td style={{ fontWeight: 600, color: isOrder ? 'var(--primary)' : '#fff' }}>
                              ${(t.quantity * t.price).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add Catalog Product' : 'Edit Catalog Product'}</h2>
              <button className="btn btn-secondary btn-ghost" style={{ padding: '4px' }} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="auth-error">
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">SKU (Unique)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. FOOD-RICE-001" 
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Basmati Rice" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    required
                  >
                    <option value="Food Products">Food Products</option>
                    <option value="Kitchen Products">Kitchen Products</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      className="form-input" 
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Min Threshold</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Describe this product..." 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows="3"
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : (
                    'Save Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
