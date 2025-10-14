'use client';

interface OrderFiltersProps {
  filters: {
    status: string;
    start_date: string;
    end_date: string;
    min_amount: string;
    max_amount: string;
  };
  setFilters: (filters: any) => void;
}

export default function OrderFilters({ filters, setFilters }: OrderFiltersProps) {
  const handleChange = (field: string, value: string) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      start_date: '',
      end_date: '',
      min_amount: '',
      max_amount: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="void">Void</option>
          </select>
        </div>

        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            value={filters.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="end_date"
            value={filters.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
            className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="min_amount" className="block text-sm font-medium text-gray-700 mb-1">
            Min Amount
          </label>
          <input
            type="number"
            id="min_amount"
            value={filters.min_amount}
            onChange={(e) => handleChange('min_amount', e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="max_amount" className="block text-sm font-medium text-gray-700 mb-1">
            Max Amount
          </label>
          <input
            type="number"
            id="max_amount"
            value={filters.max_amount}
            onChange={(e) => handleChange('max_amount', e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.status && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              Status: {filters.status}
              <button
                onClick={() => handleChange('status', '')}
                className="ml-2 inline-flex items-center text-indigo-600 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.start_date && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              From: {filters.start_date}
              <button
                onClick={() => handleChange('start_date', '')}
                className="ml-2 inline-flex items-center text-indigo-600 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.end_date && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              To: {filters.end_date}
              <button
                onClick={() => handleChange('end_date', '')}
                className="ml-2 inline-flex items-center text-indigo-600 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.min_amount && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              Min: ${filters.min_amount}
              <button
                onClick={() => handleChange('min_amount', '')}
                className="ml-2 inline-flex items-center text-indigo-600 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.max_amount && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              Max: ${filters.max_amount}
              <button
                onClick={() => handleChange('max_amount', '')}
                className="ml-2 inline-flex items-center text-indigo-600 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

