import React, { useState, useEffect } from 'react';
import { FaCopy, FaEllipsisH } from 'react-icons/fa';

// Mock data (replace with API call)
const mockTokens = [
  {
    id: 'token1',
    entityName: 'report.pdf',
    type: 'File',
    tokenValue: 'shr_xyz123abc',
    expiresAt: '2024-12-31',
    createdAt: '2023-11-01',
    status: 'active',
  },
  {
    id: 'token2',
    entityName: 'Photos',
    type: 'Folder',
    tokenValue: 'shr_deF456ghi',
    expiresAt: '2024-01-15',
    createdAt: '2023-10-15',
    status: 'expired',
  },
  {
    id: 'token3',
    entityName: 'budget.docx',
    type: 'File',
    tokenValue: 'shr_JkL789mno',
    expiresAt: '2023-11-30',
    createdAt: '2023-10-28',
    status: 'revoked',
  },
];

const StatusBadge = ({ status }) => {
  let className = 'status-badge ';
  switch (status.toLowerCase()) {
    case 'active':
      className += 'active';
      break;
    case 'expired':
      className += 'expired';
      break;
    case 'revoked':
      className += 'revoked';
      break;
    default:
      className += 'default';
  }
  return <span className={className}>{status}</span>;
};

const TokenManagementPage = () => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    // Simulate API call
    setTokens(mockTokens);
  }, []);

  const handleCopyToken = (tokenValue) => {
    navigator.clipboard.writeText(tokenValue)
      .then(() => alert(`Token "${tokenValue}" copied to clipboard!`))
      .catch(err => console.error('Failed to copy token: ', err));
  };

  const handleActions = (tokenId) => {
    // Placeholder for actions like Revoke, Edit Expiry, etc.
    alert(`Actions for token ID: ${tokenId}`);
  };

  return (
    <>
      <div className="page-header">
        <h1>Token Management</h1>
        <p>View, manage, and revoke your shared file and folder tokens.</p>
      </div>

      <div className="token-table-container">
        <table className="token-table">
          <thead>
            <tr>
              <th>Entity Name</th>
              <th>Type</th>
              <th>Token Value</th>
              <th>Expires At</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  No tokens generated yet.
                </td>
              </tr>
            ) : (
              tokens.map((token) => (
                <tr key={token.id}>
                  <td>{token.entityName}</td>
                  <td>{token.type}</td>
                  <td className="token-value-cell">
                    <span>{token.tokenValue}</span>
                    <FaCopy onClick={() => handleCopyToken(token.tokenValue)} title="Copy token"/>
                  </td>
                  <td>{token.expiresAt}</td>
                  <td>{token.createdAt}</td>
                  <td>
                    <StatusBadge status={token.status} />
                  </td>
                  <td className="actions-cell">
                    <FaEllipsisH onClick={() => handleActions(token.id)} title="More actions"/>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TokenManagementPage;