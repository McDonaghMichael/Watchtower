import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AlertNotice from '../../../components/notices/AlertNotice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

function ServerMetricsPage() {

  const { id } = useParams();
  const [metrics, setMetrics] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/metrics/server/${id}`);
        const data = Array.isArray(res.data) ? res.data : [res.data];
        console.log(data);
        setMetrics(data);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError({
          status: err.response?.status,
          message: err.message
        });
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div style={{ padding: '20px', color: '#d4d4d4' }}>Loading metrics...</div>;

  if (error) {
    return <AlertNotice id={id} error={error} />;
  }

  
  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleString('en-UK', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  const filteredMetrics = metrics.filter(metric => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      String(metric.id || '').toLowerCase().includes(search) ||
      String(metric.num_of_cpu || '').toLowerCase().includes(search) ||
      String(metric.memory_allocated || '').toLowerCase().includes(search) ||
      String(metric.disk_usage_used || '').toLowerCase().includes(search)
    );
  });

  return (
    <div style={{ 
      padding: '20px', 
      background: '#0d1117', 
      minHeight: '100vh' 
    }}>
      <div style={{ 
        background: '#161b22', 
        padding: '12px 16px', 
        marginBottom: '10px',
        fontFamily: 'monospace',
        color: '#c9d1d9',
        borderLeft: '3px solid #58a6ff'
      }}>
        <span style={{ color: '#7ee787' }}>SERVER_METRICS</span>
        <span style={{ color: '#8b949e' }}> // </span>
        <span style={{ color: '#ffa657' }}>server_id={id}</span>
        <span style={{ color: '#8b949e' }}> // </span>
        <span style={{ color: '#79c0ff' }}>count={filteredMetrics.length}</span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Search metrics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#c9d1d9',
            fontFamily: 'monospace',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ 
        background: '#0d1117',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto'
      }}>
        {filteredMetrics.length === 0 ? (
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
            fontFamily: 'monospace'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ color: '#8b949e', fontSize: '16px', marginBottom: '8px' }}>
              {searchTerm ? 'No metrics found matching your search' : 'No metrics available'}
            </div>
            <div style={{ color: '#6e7681', fontSize: '13px' }}>
              {searchTerm ? 'Try adjusting your search terms' : 'Metrics will appear here once they are collected'}
            </div>
          </div>
        ) : (
          filteredMetrics.map((metric, index) => (
            <div key={metric.id || index} style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              padding: '12px 16px',
              background: index % 2 === 0 ? '#0d1117' : '#161b22',
              color: '#c9d1d9',
              borderLeft: '3px solid #58a6ff',
              marginBottom: '2px'
            }}>
              <span style={{ color: '#8b949e', minWidth: '160px' }}>[{getTimestamp()}]</span>
              <span style={{ color: '#7ee787' }}>ID:{metric.id || 'N/A'}</span>
              <span style={{ color: '#ffa657' }}>CPU:{metric.num_of_cpu || 'N/A'}</span>
              <span style={{ color: '#79c0ff' }}>MEM_ALLOCATED:{metric.memory_allocated || 'N/A'}</span>
              <span style={{ color: '#d2a8ff' }}>MEM_ALLOCATIONS:{metric.memory_allocations || 'N/A'}</span>
              <span style={{ color: '#56d364' }}>DISK_TOTAL:{metric.disk_usage_total || 'N/A'}</span>
              <span style={{ color: '#f85149' }}>DISK_USED:{metric.disk_usage_used || 'N/A'}</span>
              <span style={{ color: '#58a6ff' }}>DISK_FREE:{metric.disk_usage_free || 'N/A'}</span>
              <span style={{ color: '#ffa657' }}>SSH:{metric.ssh_connections || 'N/A'}</span>
              <span style={{ color: '#79c0ff' }}>HTTP:{metric.http_connections || 'N/A'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ServerMetricsPage;