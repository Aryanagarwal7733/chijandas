import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ShoppingBag, Loader2, AlertCircle, 
  ShoppingCart, RefreshCw, LogOut, Check, ChevronRight, X
} from 'lucide-react';

const UserDashboard = ({ user, token, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Order Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch Products
      const productsRes = await fetch(`${API_URL}/products`, { headers });
      if (!productsRes.ok) throw new Error('Failed to load catalog products');
      const productsData = await productsRes.json();
      setProducts(productsData);

      // Fetch User's specific order transactions
      const transRes = await fetch(`${API_URL}/transactions`, { headers });
      if (!transRes.ok) throw new Error('Failed to load order history');
      const transData = await transRes.json();
      setTransactions(transData);

    } catch (err) {
      setError(err.message || 'Error fetching store data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleOpenOrderModal = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setOrderError('');
    setOrderSuccess(false);
    setIsOrderModalOpen(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setOrderError('');
    setOrderSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/products/${selectedProduct._id}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: Number(orderQuantity) })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      setOrderSuccess(true);
      setTimeout(() => {
        setIsOrderModalOpen(false);
        fetchData(); // Refresh list and logs
      }, 1500);

    } catch (err) {
      setOrderError(err.message || 'Server error placing order');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

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
            <ShoppingBag size={18} />
            <span>Store Catalog</span>
          </li>
          <li className="nav-item" onClick={fetchData}>
            <RefreshCw size={18} />
            <span>Refresh Items</span>
          </li>
        </ul>

        <div className="user-profile-section">
          <div className="user-profile-info">
            <div className="user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-display-name">{user.username}</span>
              <span className="user-role-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                {user.role}
              </span>
            </div>
          </div>
          <button className="btn btn-secondary btn-ghost" onClick={onLogout} style={{ justifyContent: 'flex-start' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Welcome, {user.username.split(' ')[0]}!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Browse kitchen and food products. Order items directly to your cart.</p>
          </div>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: 0 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Section */}
        <div className="glass-card" style={{ padding: '16px 24px' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-input-wrapper" style={{ maxWidth: 'none', flexGrow: 1 }}>
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                className="form-input search-input" 
                placeholder="Search food or kitchen products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select 
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ paddingRight: '36px', height: '45px', minWidth: '200px' }}
            >
              <option value="All">All Categories</option>
              <option value="Food Products">Food Products</option>
              <option value="Kitchen Products">Kitchen Products</option>
            </select>
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <Loader2 size={36} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            <p>Gathering fresh inventory items...</p>
          </div>
        ) : (
          <>
            {/* Catalog Grid */}
            <div className="product-grid">
              {filteredProducts.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                  No products available in this category.
                </div>
              ) : (
                filteredProducts.map(product => {
                  const isOut = product.quantity === 0;
                  const isLow = !isOut && product.quantity <= product.minStockLevel;

                  return (
                    <div key={product._id} className="glass-card product-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-info">{product.category}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {product.sku}
                        </span>
                      </div>

                      <div className="product-card-body">
                        <div className="product-title-row">
                          <h4 className="product-name">{product.name}</h4>
                          <span className="product-price">${product.price.toFixed(2)}</span>
                        </div>
                        <p className="product-desc">
                          {product.description || 'No description provided for this grocery mall product.'}
                        </p>
                        
                        <div className="product-stock-status">
                          <span style={{ color: 'var(--text-secondary)' }}>Availability:</span>
                          {isOut ? (
                            <span className="badge badge-danger">Out of Stock</span>
                          ) : isLow ? (
                            <span className="badge badge-warning">Only {product.quantity} left!</span>
                          ) : (
                            <span className="badge badge-success">In Stock ({product.quantity})</span>
                          )}
                        </div>
                      </div>

                      <div className="product-action-row">
                        <button 
                          className="btn btn-primary" 
                          style={{ width: '100%', gap: '6px' }}
                          onClick={() => handleOpenOrderModal(product)}
                          disabled={isOut}
                        >
                          <ShoppingCart size={14} />
                          {isOut ? 'Unavailable' : 'Order Item'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* User Order History */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '16px' }}>Your Recent Orders</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Quantity Purchased</th>
                      <th>Unit Price</th>
                      <th>Total Paid</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                          You have not placed any orders yet. Try ordering a product above!
                        </td>
                      </tr>
                    ) : (
                      transactions.map(t => {
                        const date = new Date(t.timestamp).toLocaleString();
                        return (
                          <tr key={t._id}>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{date}</td>
                            <td style={{ fontWeight: 600, color: '#ffffff' }}>{t.productName}</td>
                            <td>{t.quantity}</td>
                            <td>${t.price.toFixed(2)}</td>
                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                              ${(t.quantity * t.price).toFixed(2)}
                            </td>
                            <td>
                              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={10} /> Delivered
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
          </>
        )}
      </main>

      {/* Place Order Modal */}
      {isOrderModalOpen && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Purchase Order</h2>
              <button 
                className="btn btn-secondary btn-ghost" 
                style={{ padding: '4px' }} 
                onClick={() => setIsOrderModalOpen(false)}
                disabled={orderSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder}>
              <div className="modal-body">
                {orderSuccess ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Check size={28} />
                    </div>
                    <h3 style={{ color: '#ffffff' }}>Order Successful!</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
                      Your order for {orderQuantity}x {selectedProduct.name} has been processed successfully.
                    </p>
                  </div>
                ) : (
                  <>
                    {orderError && (
                      <div className="auth-error">
                        <AlertCircle size={18} />
                        <span>{orderError}</span>
                      </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                      <span className="badge badge-info" style={{ marginBottom: '8px' }}>{selectedProduct.category}</span>
                      <h3 style={{ color: '#ffffff', fontSize: '20px' }}>{selectedProduct.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{selectedProduct.description}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Price per unit:</span>
                      <strong style={{ color: '#ffffff' }}>${selectedProduct.price.toFixed(2)}</strong>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Purchase Quantity</label>
                      <input 
                        type="number"
                        min="1"
                        max={selectedProduct.quantity}
                        className="form-input"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(Math.max(1, Math.min(selectedProduct.quantity, Number(e.target.value))))}
                        required
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Maximum available: {selectedProduct.quantity} units
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 500 }}>Total Price:</span>
                      <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                        ${(selectedProduct.price * orderQuantity).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {!orderSuccess && (
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsOrderModalOpen(false)} disabled={orderSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={orderSubmitting || selectedProduct.quantity === 0}>
                    {orderSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                        Ordering...
                      </>
                    ) : (
                      'Confirm Purchase'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
