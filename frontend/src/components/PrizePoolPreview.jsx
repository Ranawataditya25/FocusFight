import React from 'react';

const PrizePoolPreview = ({ durationType, durationValue, maxParticipants = 10, entryFee = 0, payoutStructure = 'top_3', currentParticipants }) => {
  const participantsCount = currentParticipants || maxParticipants;
  
  let fallbackDays = 1;
  if (durationType === 'week') fallbackDays = 7;
  else if (durationType === 'month') fallbackDays = 30;
  else if (durationType === 'custom') fallbackDays = durationValue || 7;
  
  const totalPrizePool = entryFee > 0 ? (entryFee * participantsCount) : (fallbackDays * 10 * participantsCount);
  
  let effectivePayoutStructure = payoutStructure;
  if (participantsCount <= 2) {
    effectivePayoutStructure = 'winner_takes_all';
  } else if (participantsCount === 3 && payoutStructure === 'top_half') {
    effectivePayoutStructure = 'top_3';
  }

  let rankPercentages = [];
  if (effectivePayoutStructure === 'winner_takes_all') {
    rankPercentages = [1.0];
  } else if (effectivePayoutStructure === 'top_3') {
    rankPercentages = [0.5, 0.3, 0.2];
  } else if (effectivePayoutStructure === 'top_half') {
    const winnersCount = Math.max(1, Math.floor(participantsCount / 2));
    const split = 1.0 / winnersCount;
    rankPercentages = Array(winnersCount).fill(split);
  }

  const rankAmounts = rankPercentages.map((perc, i) => {
    if (i === rankPercentages.length - 1) {
      let totalGiven = 0;
      for (let j = 0; j < i; j++) {
        totalGiven += Math.floor(totalPrizePool * rankPercentages[j]);
      }
      return totalPrizePool - totalGiven;
    }
    return Math.floor(totalPrizePool * perc);
  });

  const renderRank = (index) => {
    const amount = index < rankAmounts.length ? rankAmounts[index] : 0;
    if (amount === 0) return null;

    let icon = "🏅";
    let label = `${index + 1}th`;
    if (index === 0) { icon = "🥇"; label = "1st"; }
    else if (index === 1) { icon = "🥈"; label = "2nd"; }
    else if (index === 2) { icon = "🥉"; label = "3rd"; }

    return (
      <div key={index} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-slate-900">
        <span className="font-medium text-slate-700 dark:text-slate-300">{icon} {label}</span>
        <span className="font-bold text-brand-600 dark:text-brand-400">{amount} cr</span>
      </div>
    );
  };

  const ranksToRender = [];
  for (let i = 0; i < rankPercentages.length; i++) {
    ranksToRender.push(i);
  }

  return (
    <div className="rounded-3xl border border-brand-500/20 bg-brand-50/50 p-5 dark:border-brand-500/10 dark:bg-brand-500/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-brand-600 dark:text-brand-400">Prize Pool Breakdown</h4>
          {entryFee > 0 && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Calculated for {participantsCount} participants</p>}
        </div>
        <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
          {totalPrizePool} Credits Total
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
        {ranksToRender.map(idx => renderRank(idx))}
      </div>
    </div>
  );
};

export default PrizePoolPreview;
