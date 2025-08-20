import React from 'react';
import ItemForm from '../components/ItemReportForm';

export default function ReportPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Report a Lost or Found Item</h1>
      <p className="text-gray-600 mb-6">
        Add details so the community can help reconnect items with owners.
      </p>
      <ItemForm />
    </div>
  );
}
