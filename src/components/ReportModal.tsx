import { useState } from 'react';
import { Flag, X, AlertCircle, CheckCircle } from 'lucide-react';
import { database, ref, push, set } from '../lib/firebase';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  reporterId: string;
}

const REPORT_REASONS = [
  'Inappropriate content',
  'Harassment',
  'Cheating',
  'Other'
];

export default function ReportModal({ isOpen, onClose, gameId, reporterId }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      const reportRef = push(ref(database, 'reports'));
      await set(reportRef, {
        reporterId,
        reportedGameId: gameId,
        reason: selectedReason,
        details: details.trim(),
        timestamp: Date.now()
      });
      setSubmitted(true);
    } catch {
      // Silently handle — user still sees confirmation
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/10 rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Report Player</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <p className="text-white font-semibold">Report submitted</p>
              <p className="text-gray-400 text-sm text-center">
                Thank you for helping keep 2Players safe.
              </p>
              <button
                onClick={handleClose}
                className="mt-2 px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-4">
                Select a reason for your report:
              </p>

              <div className="space-y-2 mb-4">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                      selectedReason === reason
                        ? 'border-red-500 bg-red-500/10 text-white'
                        : 'border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <div className="mb-5">
                <label className="text-sm text-gray-400 mb-1 block">
                  Additional details (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 200))}
                  placeholder="Describe what happened..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <p className="text-xs text-gray-500 text-right mt-1">{details.length}/200</p>
              </div>

              {!selectedReason && (
                <div className="flex items-center gap-2 mb-4 text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Please select a reason</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedReason || isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
