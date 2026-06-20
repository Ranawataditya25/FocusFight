import React from 'react';

const PrizePoolPreview = ({ durationType, durationValue }) => {
  const days = durationType === 'week' ? 7 
             : durationType === 'month' ? 30 
             : durationType === 'day' ? 1 
             : durationValue || 7;
             
  const totalPrize = days * 10;

  return (
    <div className="rounded-3xl border border-brand-500/20 bg-brand-50/50 p-5 dark:border-brand-500/10 dark:bg-brand-500/5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-brand-600 dark:text-brand-400">Prize Pool Breakdown</h4>
        <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
          {totalPrize} Credits Total
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-slate-900">
          <span className="font-medium text-slate-700 dark:text-slate-300">🥇 1st</span>
          <span className="font-bold text-brand-600 dark:text-brand-400">{totalPrize} cr</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-slate-900">
          <span className="font-medium text-slate-700 dark:text-slate-300">🥈 2nd</span>
          <span className="font-bold text-slate-900 dark:text-white">{Math.floor(totalPrize * 0.5)} cr</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-slate-900">
          <span className="font-medium text-slate-700 dark:text-slate-300">🥉 3rd</span>
          <span className="font-bold text-slate-900 dark:text-white">{Math.floor(totalPrize * 0.25)} cr</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-slate-900">
          <span className="font-medium text-slate-700 dark:text-slate-300">Other</span>
          <span className="font-bold text-slate-500 dark:text-slate-400">{Math.floor(totalPrize * 0.1)} cr</span>
        </div>
      </div>
    </div>
  );
};

export default PrizePoolPreview;
