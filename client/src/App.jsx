import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const defaultForm = {
  title: '',
  description: '',
  category: 'Lighting',
  location: '',
  priority: 'Medium',
};

const statusOptions = ['Reported', 'Assigned', 'In Progress', 'Resolved'];
const categoryOptions = ['Lighting', 'Facilities', 'Water', 'Safety', 'Equipment', 'Cleanliness', 'Technology'];
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

function App() {
  const [issues, setIssues] = useState([]);
  const [filters, setFilters] = useState({ category: '', priority: '', status: '' });
  const [formData, setFormData] = useState(defaultForm);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchIssues = async () => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await fetch(`${API_URL}/issues?${params.toString()}`);
    const data = await response.json();
    setIssues(data);
  };

  useEffect(() => {
    fetchIssues();
  }, [filters]);

  const stats = useMemo(() => {
    return {
      total: issues.length,
      unresolved: issues.filter((issue) => issue.status !== 'Resolved').length,
      resolved: issues.filter((issue) => issue.status === 'Resolved').length,
    };
  }, [issues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => form.append(key, value));
    if (image) {
      form.append('image', image);
    }

    try {
      const response = await fetch(`${API_URL}/issues`, {
        method: 'POST',
        body: form,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Issue could not be submitted.');
      }

      setFormData(defaultForm);
      setImage(null);
      setMessage('Issue reported successfully.');
      fetchIssues();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateIssueStatus = async (issueId, status) => {
    const response = await fetch(`${API_URL}/issues/${issueId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();

    if (response.ok) {
      const updated = issues.map((issue) => (issue.id === issueId ? result : issue));
      setIssues(updated);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-name">CampusFix</div>
            <div className="brand-subtext">Campus upkeep made easy</div>
          </div>
        </div>
        <nav className="nav-links">
          <a href="#report">Report</a>
          <a href="#dashboard">Dashboard</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">College maintenance, simplified</span>
            <h1>Report campus problems before they become bigger issues.</h1>
            <p>
              CampusFix helps students quickly report maintenance problems, damaged equipment,
              cleanliness concerns, and facility issues so they get resolved faster.
            </p>
            <div className="hero-actions">
              <a href="#report" className="primary-btn">Report an Issue</a>
              <a href="#dashboard" className="secondary-btn">View Dashboard</a>
            </div>
            <div className="hero-metrics">
              <div>
                <strong>{stats.total}</strong>
                <span>Total reports</span>
              </div>
              <div>
                <strong>{stats.unresolved}</strong>
                <span>Open issues</span>
              </div>
              <div>
                <strong>{stats.resolved}</strong>
                <span>Resolved</span>
              </div>
            </div>
          </div>

          <div className="hero-card">
            <div className="mini-card">
              <span className="mini-tag">Live</span>
              <h3>Quick campus insights</h3>
              <ul>
                <li>Lighting checks</li>
                <li>Maintenance alerts</li>
                <li>Water safety issues</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="report" className="content-grid">
          <div className="panel form-panel">
            <div className="section-header">
              <p className="kicker">Student portal</p>
              <h2>Report an Issue</h2>
            </div>

            <form onSubmit={handleSubmit} className="issue-form">
              <div className="form-grid">
                <label>
                  <span>Issue title</span>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Broken projector in lecture hall"
                    required
                  />
                </label>

                <label>
                  <span>Category</span>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Location</span>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Library, 2nd floor"
                    required
                  />
                </label>

                <label>
                  <span>Priority</span>
                  <select name="priority" value={formData.priority} onChange={handleChange}>
                    {priorityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Describe the problem, when it started, and any safety concerns."
                  required
                />
              </label>

              <label className="upload-box">
                <span>Optional image</span>
                <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files[0])} />
                {image && <small>{image.name}</small>}
              </label>

              {message && <div className="status-message">{message}</div>}

              <button type="submit" className="primary-btn submit-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>

          <div id="dashboard" className="panel dashboard-panel">
            <div className="section-header">
              <p className="kicker">Admin dashboard</p>
              <h2>Issue Tracker</h2>
            </div>

            <div className="stats-row">
              <div className="stat-box">
                <span>Total</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="stat-box warning">
                <span>Unresolved</span>
                <strong>{stats.unresolved}</strong>
              </div>
              <div className="stat-box success">
                <span>Resolved</span>
                <strong>{stats.resolved}</strong>
              </div>
            </div>

            <div className="filter-grid">
              <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
                <option value="">All categories</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
                <option value="">All priorities</option>
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="issue-list">
              {issues.length === 0 ? (
                <div className="empty-state">No issues match the selected filters.</div>
              ) : (
                issues.map((issue) => (
                  <article key={issue.id} className="issue-item">
                    <div className="issue-row top-row">
                      <div>
                        <div className="issue-id">{issue.id}</div>
                        <h3>{issue.title}</h3>
                      </div>
                      <span className={`status-badge ${issue.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {issue.status}
                      </span>
                    </div>

                    <p className="issue-description">{issue.description}</p>

                    <div className="meta-row">
                      <span>{issue.category}</span>
                      <span>{issue.location}</span>
                      <span>{issue.priority}</span>
                    </div>

                    {issue.imageUrl && (
                      <img src={issue.imageUrl} alt={issue.title} className="issue-image" />
                    )}

                    <div className="status-actions">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={issue.status === status ? 'active' : ''}
                          onClick={() => updateIssueStatus(issue.id, status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
