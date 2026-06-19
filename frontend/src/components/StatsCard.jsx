const StatsCard = ({ title, value, meta }) => {
  return (
    <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-5 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
      <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{title}</h3>
      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{meta}</p>
    </div>
  );
};

export default StatsCard;
