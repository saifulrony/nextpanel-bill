'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartDataPoint {
  name: string;
  revenue?: number;
  orders?: number;
  value?: number;
}

interface ChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
}

// Revenue Column Chart using Chart.js
export function RevenueColumnChart({ data, title = 'Revenue Trend', height = 300 }: ChartProps) {
  // Ensure data is an array and has valid structure
  const chartData = Array.isArray(data) && data.length > 0 
    ? data.map(item => ({
        name: item.name || '',
        revenue: typeof item.revenue === 'number' ? item.revenue : 0
      }))
    : [];
  
  if (chartData.length === 0) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        )}
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }
  
  const chartConfig = {
    labels: chartData.map(item => item.name),
    datasets: [
      {
        label: 'Revenue',
        data: chartData.map(item => item.revenue),
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context: any) {
            return `Revenue: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: '#e5e7eb',
          borderDash: [3, 3],
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return `$${value}`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <Bar data={chartConfig} options={options} />
      </div>
    </div>
  );
}

// Orders Column Chart using Chart.js
export function OrdersColumnChart({ data, title = 'Orders Trend', height = 300 }: ChartProps) {
  // Ensure data is an array and has valid structure
  const chartData = Array.isArray(data) && data.length > 0 
    ? data.map(item => ({
        name: item.name || '',
        orders: typeof item.orders === 'number' ? item.orders : 0
      }))
    : [];
  
  if (chartData.length === 0) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        )}
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }
  
  const chartConfig = {
    labels: chartData.map(item => item.name),
    datasets: [
      {
        label: 'Orders',
        data: chartData.map(item => item.orders),
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context: any) {
            return `Orders: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: '#e5e7eb',
          borderDash: [3, 3],
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <Bar data={chartConfig} options={options} />
      </div>
    </div>
  );
}

// Keep the old recharts components for backward compatibility (if needed elsewhere)
export function RevenueWaveChart({ data, title = 'Revenue Trend', height = 300 }: ChartProps) {
  // Placeholder - can be implemented with Chart.js Line chart if needed
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="flex items-center justify-center h-64 text-gray-500">
        Chart not implemented
      </div>
    </div>
  );
}

export function OrdersWaveChart({ data, title = 'Orders Trend', height = 300 }: ChartProps) {
  // Placeholder - can be implemented with Chart.js Line chart if needed
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="flex items-center justify-center h-64 text-gray-500">
        Chart not implemented
      </div>
    </div>
  );
}
