const StatsCard = ({ title, value, meta }) => {
  return (
    <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-4 sm:p-5 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85 min-w-0">
      <h3 className="text-[10px] sm:text-sm font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{title}</h3>
      <div className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold text-slate-900 dark:text-white truncate">{value}</div>
      <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">{meta}</p>
    </div>
  );
};

export default StatsCard;
