import { useState, useEffect } from 'react';
import { AlertCircle, Car, Construction, AlertTriangle, Shield, XCircle, ThumbsUp, ThumbsDown, Camera } from 'lucide-react';
import { communityService, ReportType, Severity } from '../services/communityService';
import { CommunityReport } from '../lib/supabase';

interface CommunityReportPanelProps {
  currentLocation: { lat: number; lng: number } | null;
  onReportCreated: () => void;
}

const reportTypes: { type: ReportType; label: string; icon: any }[] = [
  { type: 'accident', label: 'Accident', icon: Car },
  { type: 'hazard', label: 'Hazard', icon: AlertTriangle },
  { type: 'police', label: 'Police', icon: Shield },
  { type: 'traffic', label: 'Traffic', icon: AlertCircle },
  { type: 'construction', label: 'Construction', icon: Construction },
  { type: 'road_closure', label: 'Road Closed', icon: XCircle },
];

const severityLevels: { value: Severity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
];

export default function CommunityReportPanel({ currentLocation, onReportCreated }: CommunityReportPanelProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'nearby'>('nearby');
  const [selectedType, setSelectedType] = useState<ReportType>('traffic');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nearbyReports, setNearbyReports] = useState<CommunityReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (currentLocation) {
      loadNearbyReports();
    }
  }, [currentLocation]);

  const loadNearbyReports = async () => {
    if (!currentLocation) return;

    setLoadingReports(true);
    try {
      const reports = await communityService.getNearbyReports(currentLocation, 10);
      setNearbyReports(reports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!currentLocation || !description) return;

    setIsSubmitting(true);
    try {
      await communityService.createReport(
        selectedType,
        currentLocation,
        description,
        severity
      );

      setDescription('');
      setActiveTab('nearby');
      await loadNearbyReports();
      onReportCreated();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (reportId: string, voteType: 'upvote' | 'downvote') => {
    await communityService.voteOnReport(reportId, voteType);
    await loadNearbyReports();
  };

  const getTimeSince = (timestamp: string): string => {
    const now = new Date();
    const reportTime = new Date(timestamp);
    const diffMs = now.getTime() - reportTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-6 h-6 text-orange-600" />
        <h2 className="text-xl font-bold">Community Reports</h2>
      </div>

      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => setActiveTab('nearby')}
          className={`flex-1 py-2 px-4 font-medium transition-colors ${
            activeTab === 'nearby'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Nearby
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 px-4 font-medium transition-colors ${
            activeTab === 'create'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Report
        </button>
      </div>

      {activeTab === 'create' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {reportTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    selectedType === type
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <div className="flex gap-2">
              {severityLevels.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setSeverity(value)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium text-white transition-all ${color} ${
                    severity === value ? 'ring-2 ring-offset-2 ring-gray-400' : 'opacity-60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you see..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSubmitReport}
            disabled={!currentLocation || !description || isSubmitting}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>

          {!currentLocation && (
            <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>Enable location to submit reports</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loadingReports ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
              <p>Loading reports...</p>
            </div>
          ) : nearbyReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No reports nearby</p>
            </div>
          ) : (
            nearbyReports.map((report) => {
              const reportType = reportTypes.find(t => t.type === report.report_type);
              const Icon = reportType?.icon || AlertCircle;

              return (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: communityService.getReportColor(report.report_type) + '20' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: communityService.getReportColor(report.report_type) }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 capitalize">
                          {report.report_type.replace('_', ' ')}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${
                          severityLevels.find(s => s.value === report.severity)?.color
                        }`}>
                          {report.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{report.description}</p>
                      <p className="text-xs text-gray-400">{getTimeSince(report.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleVote(report.id, 'upvote')}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{report.upvotes}</span>
                    </button>
                    <button
                      onClick={() => handleVote(report.id, 'downvote')}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>{report.downvotes}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
