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
  
  // Structured Address States
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [indianState, setIndianState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('COD'); // Default COD
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    
    // Autofill structured address from localStorage, fallback to user.username for name
    setRecipientName(localStorage.getItem('chijandas_recipient_name') || user.username || '');
    setPhoneNumber(localStorage.getItem('chijandas_phone_number') || user.phoneNumber || '');
    setStreetAddress(localStorage.getItem('chijandas_street_address') || '');
    setCity(localStorage.getItem('chijandas_city') || '');
    setIndianState(localStorage.getItem('chijandas_indian_state') || 'Maharashtra');
    setPincode(localStorage.getItem('chijandas_pincode') || '');
    
    setPaymentMethod('COD');
    setOrderError('');
    setOrderSuccess(false);
    setIsOrderModalOpen(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setOrderError('');
    setOrderSubmitting(true);

    // Validate phone number length (10 digits)
    if (phoneNumber.trim().length !== 10 || isNaN(phoneNumber.trim())) {
      setOrderError('Please enter a valid 10-digit Indian phone number.');
      setOrderSubmitting(false);
      return;
    }

    // Validate pincode length (6 digits)
    if (pincode.trim().length !== 6 || isNaN(pincode.trim())) {
      setOrderError('Please enter a valid 6-digit Pincode.');
      setOrderSubmitting(false);
      return;
    }

    // Format full address for server storage
    const fullAddress = `${recipientName.trim()} | Ph: ${phoneNumber.trim()} | ${streetAddress.trim()}, ${city.trim()}, ${indianState} - ${pincode.trim()}`;

    try {
      const res = await fetch(`${API_URL}/products/${selectedProduct._id}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          quantity: Number(orderQuantity),
          shippingAddress: fullAddress,
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      setOrderSuccess(true);
      
      // Save structured address fields locally for future autofills
      localStorage.setItem('chijandas_recipient_name', recipientName.trim());
      localStorage.setItem('chijandas_phone_number', phoneNumber.trim());
      localStorage.setItem('chijandas_street_address', streetAddress.trim());
      localStorage.setItem('chijandas_city', city.trim());
      localStorage.setItem('chijandas_indian_state', indianState);
      localStorage.setItem('chijandas_pincode', pincode.trim());
      localStorage.setItem('chijandas_saved_address', fullAddress);
      
      // Update savedAddress in local user profile cache
      const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
      cachedUser.savedAddress = fullAddress;
      localStorage.setItem('user', JSON.stringify(cachedUser));

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

  const findIndianStateMatch = (apiState) => {
    const states = [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", 
      "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", 
      "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", 
      "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
      "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir"
    ];
    
    const cleanApi = apiState.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    
    return states.find(s => {
      const cleanS = s.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      return cleanS.includes(cleanApi) || cleanApi.includes(cleanS);
    }) || null;
  };

  const handlePincodeChange = async (val) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 6);
    setPincode(cleanVal);

    if (cleanVal.length === 6) {
      setPincodeLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleanVal}`);
        const data = await response.json();
        
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice[0]) {
          const postOffice = data[0].PostOffice[0];
          
          if (postOffice.District) {
            setCity(postOffice.District);
          }
          
          if (postOffice.State) {
            const matchedState = findIndianStateMatch(postOffice.State);
            if (matchedState) {
              setIndianState(matchedState);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching postal data by pincode:', err);
      } finally {
        setPincodeLoading(false);
      }
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
                      <th>Total Paid</th>
                      <th>Shipping Address</th>
                      <th>Payment Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
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
                            <td>{t.quantity} items (at ${t.price.toFixed(2)}/ea)</td>
                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                              ${(t.quantity * t.price).toFixed(2)}
                            </td>
                            <td style={{ fontSize: '13px', maxStrokeWidth: '150px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {t.shippingAddress || 'N/A'}
                            </td>
                            <td>
                              <span className={`badge ${t.paymentMethod === 'UPI' ? 'badge-info' : 'badge-warning'}`}>
                                {t.paymentMethod || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={10} /> Confirmed
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

                    <div className="form-group">
                      <label className="form-label">Recipient Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Aryan Agarwal" 
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number (10 Digits)</label>
                      <input 
                        type="tel" 
                        pattern="[0-9]{10}"
                        maxLength="10"
                        className="form-input" 
                        placeholder="e.g. 9876543210" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Flat / House No / Road / Locality</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Flat 101, Green Heights, MG Road" 
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Mumbai" 
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Pincode (6 Digits)</label>
                        <input 
                          type="text" 
                          pattern="[0-9]{6}"
                          maxLength="6"
                          className="form-input" 
                          placeholder="e.g. 400001" 
                          value={pincode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          required
                        />
                        {pincodeLoading && (
                          <span style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px', display: 'block', animation: 'pulse 1.5s infinite' }}>
                            Autodetecting city & state...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">State</label>
                      <select 
                        className="form-select"
                        value={indianState}
                        onChange={(e) => setIndianState(e.target.value)}
                        required
                      >
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Assam">Assam</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value="Nagaland">Nagaland</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Sikkim">Sikkim</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Delhi">Delhi (UT)</option>
                        <option value="Jammu & Kashmir">Jammu & Kashmir (UT)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Payment Method</label>
                      <select 
                        className="form-select"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        required
                      >
                        <option value="COD">COD (Cash on Delivery)</option>
                        <option value="UPI">UPI (Google Pay / PhonePe / BHIM)</option>
                      </select>
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
