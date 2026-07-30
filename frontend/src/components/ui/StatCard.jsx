import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => {
  const colors = {
    primary: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className={`border rounded-xl p-4 ${colors[color]} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value ?? 0}</p>
        </div>
        {Icon && <Icon className="w-8 h-8 opacity-70" />}
      </div>
    </div>
  );
};

export default StatCard;