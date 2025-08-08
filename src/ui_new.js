import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, GitPullRequest, Clock, AlertTriangle, ExternalLink, RefreshCw, Database } from 'lucide-react';

const FabricPRApproval = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);

  // Fabric connection configuration
  const fabricConfig = {
    workspaceId: 'your-workspace-id',
    lakehouseId: 'your-lakehouse-id',
    tableName: 'pr_approval_requests',
    // You would get this from Azure AD authentication
    accessToken: 'your-fabric-access-token'
  };

  // Mock data for demonstration (in real implementation, this comes from Fabric)
  const mockPendingRequests = [
    {
      request_id: 'pr_20250802030341',
      pr_url: 'https://github.com/klockard12/AutoCure.AI/pull/21',
      pr_title: 'Fix Schema Drift in Pipeline',
      pr_branch: 'ai/fix_20250802030341',
      problem_summary: 'The source schema had an additional column \'warehouse_inventory_level\' which was not present in the target schema.',
      fix_description: 'Updated SQL statement to select all columns excluding \'warehouse_inventory_level\' to align with target schema.',
      affected_pipeline: 'user_upload_pipeline',
      risk_level: 'Low',
      created_timestamp: '2025-08-02T03:03:41Z',
      status: 'pending'
    }
  ];

  // Simulate fetching data from Fabric REST API
  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In real implementation, this would be a call to Fabric REST API
      // const response = await fetch(`https://api.fabric.microsoft.com/v1/workspaces/${fabricConfig.workspaceId}/lakehouses/${fabricConfig.lakehouseId}/tables/${fabricConfig.tableName}/rows?$filter=status eq 'pending'`, {
      //   headers: {
      //     'Authorization': `Bearer ${fabricConfig.accessToken}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      // For demo, simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data
      setPendingRequests(mockPendingRequests);
      
    } catch (err) {
      setError('Failed to fetch pending requests from Fabric');
      console.error('Fabric API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update approval status in Fabric
  const updateApprovalStatus = async (requestId, decision, comments = '') => {
    setProcessingId(requestId);
    
    try {
      const updateData = {
        status: decision,
        reviewer: 'current-user@company.com', // Get from auth context
        review_timestamp: new Date().toISOString(),
        review_comments: comments
      };

      // In real implementation, this would update the Fabric table
      // const response = await fetch(`https://api.fabric.microsoft.com/v1/workspaces/${fabricConfig.workspaceId}/lakehouses/${fabricConfig.lakehouseId}/tables/${fabricConfig.tableName}/rows/${requestId}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Authorization': `Bearer ${fabricConfig.accessToken}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(updateData)
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update local state
      setPendingRequests(prev => 
        prev.filter(req => req.request_id !== requestId)
      );

      // Show success message
      console.log(`${decision} request ${requestId}`);
      
      // Optionally trigger GitHub API to merge/close PR
      if (decision === 'approved') {
        await triggerPRMerge(requestId);
      }
      
    } catch (err) {
      setError(`Failed to ${decision} request: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Trigger PR merge via GitHub API (or Fabric pipeline)
  const triggerPRMerge = async (requestId) => {
    try {
      // This could either call GitHub API directly or trigger a Fabric pipeline
      console.log(`Triggering merge for ${requestId}`);
      
      // Option 1: Direct GitHub API call
      // const prNumber = extractPRNumber(prUrl);
      // await mergePR(prNumber);
      
      // Option 2: Trigger Fabric Data Pipeline
      // await triggerFabricPipeline('AutoCure_PR_Merge_Pipeline', { requestId });
      
    } catch (err) {
      console.error('Failed to trigger PR merge:', err);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    
    // Set up polling to check for new requests
    const interval = setInterval(fetchPendingRequests, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (risk) => {
    switch(risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading && pendingRequests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading pending approvals from Fabric...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold">AutoCure.AI - Fabric Integration</h1>
                  <p className="text-blue-100">Pull Request Approval Dashboard</p>
                </div>
              </div>
              <button
                onClick={fetchPendingRequests}
                disabled={loading}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{pendingRequests.length}</div>
                <div className="text-blue-700 text-sm">Pending Approvals</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">Connected</div>
                <div className="text-green-700 text-sm">Fabric Status</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">Real-time</div>
                <div className="text-purple-700 text-sm">Data Sync</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Pending Requests */}
        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">All Caught Up!</h2>
            <p className="text-gray-600">No pending pull requests require approval.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingRequests.map((request) => (
              <div key={request.request_id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">{request.pr_title}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                            <a 
                              href={request.pr_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm"
                            >
                              {request.pr_url}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700 text-sm">
                              {new Date(request.created_timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm">Branch:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                              {request.pr_branch}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Pipeline & Risk</h4>
                        <div className="space-y-2">
                          <div>
                            <code className="bg-blue-50 text-blue-800 px-3 py-1 rounded text-sm">
                              {request.affected_pipeline}
                            </code>
                          </div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(request.risk_level)}`}>
                            <AlertTriangle className="w-4 h-4" />
                            {request.risk_level} Risk
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Problem & Solution */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Problem:</h4>
                        <p className="text-gray-600 text-sm">{request.problem_summary}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">AI Solution:</h4>
                        <p className="text-gray-600 text-sm">{request.fix_description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => updateApprovalStatus(request.request_id, 'rejected')}
                      disabled={processingId === request.request_id}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors min-w-[140px] justify-center"
                    >
                      {processingId === request.request_id ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Reject
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => updateApprovalStatus(request.request_id, 'approved')}
                      disabled={processingId === request.request_id}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors min-w-[140px] justify-center"
                    >
                      {processingId === request.request_id ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Approve & Merge
                        </>
                      )}
                    </button>
                  </div>

                  {/* Fabric Integration Info */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Fabric Integration:</strong> This request is stored in Delta table 
                      <code className="bg-blue-100 px-2 py-1 rounded mx-1">{fabricConfig.tableName}</code>
                      and will be automatically synced across all Fabric services.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FabricPRApproval;