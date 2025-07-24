// components/documents/StatusBadge.tsx
import React from 'react';
import { CircleNotch, CheckCircle, WarningCircle, XCircle } from 'phosphor-react';

interface Props {
  status: string;
}

type StatusKey = 'processed' | 'processing' | 'pending' | 'failed' | 'default';

const statusConfig = {
  processed: { text: 'Processed', color: 'text-green-700 bg-green-100', Icon: CheckCircle },
  processing: { text: 'Processing', color: 'text-blue-700 bg-blue-100', Icon: CircleNotch },
  pending: { text: 'Pending', color: 'text-purple-700 bg-purple-100', Icon: CircleNotch },
  failed: { text: 'Failed', color: 'text-red-700 bg-red-100', Icon: WarningCircle },
  default: { text: 'Unknown', color: 'text-gray-700 bg-gray-100', Icon: XCircle },
} as const; // Use 'as const' to infer literal types for keys

const StatusBadge: React.FC<Props> = ({ status }) => {
  // Type assertion to ensure status.toLowerCase() is a valid key
  const config = statusConfig[status.toLowerCase() as StatusKey] || statusConfig.default;
  const isProcessing = status.toLowerCase() === 'processing' || status.toLowerCase() === 'pending';
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <config.Icon size={14} weight="bold" className={isProcessing ? 'animate-spin' : ''} />
      {config.text}
    </span>
  );
};

export default StatusBadge;