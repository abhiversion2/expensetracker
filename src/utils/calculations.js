// Financial calculations, personal ledgers, and settlement optimization

/**
 * Calculates equal splits for a list of participant member IDs.
 * Ensures total sum of shares strictly equals the total amount.
 */
export function calculateEqualShares(amount, participantIds) {
  if (!participantIds || participantIds.length === 0 || amount <= 0) {
    return [];
  }

  const n = participantIds.length;
  // Use paise / cents precision
  const totalCents = Math.round(amount * 100);
  const baseShareCents = Math.floor(totalCents / n);
  const remainderCents = totalCents % n;

  return participantIds.map((memberId, idx) => {
    // Distribute remainder cents to first few participants so sum is exact
    const shareCents = baseShareCents + (idx < remainderCents ? 1 : 0);
    return {
      memberId,
      share: shareCents / 100,
    };
  });
}

/**
 * Calculates financial balance metrics for all members across the provided expenses:
 * - totalPaid: amount actually paid by member
 * - personalShare: amount consumed/owed by member as participant
 * - netBalance: totalPaid - personalShare
 * - expenseCount: number of expenses member paid for
 * - participationCount: number of expenses member was part of
 */
export function calculateMemberBalances(members, expenses) {
  const map = {};

  members.forEach(m => {
    map[m.id] = {
      member: m,
      totalPaid: 0,
      personalShare: 0,
      netBalance: 0,
      paidExpenseCount: 0,
      participationCount: 0,
    };
  });

  expenses.forEach(exp => {
    const amount = Number(exp.amount) || 0;
    // Payer credit
    if (map[exp.paidBy]) {
      map[exp.paidBy].totalPaid += amount;
      map[exp.paidBy].paidExpenseCount += 1;
    }

    // Participant debit
    if (Array.isArray(exp.participants)) {
      exp.participants.forEach(p => {
        if (map[p.memberId]) {
          map[p.memberId].personalShare += Number(p.share) || 0;
          map[p.memberId].participationCount += 1;
        }
      });
    }
  });

  // Calculate net balances
  Object.values(map).forEach(item => {
    item.totalPaid = Math.round(item.totalPaid * 100) / 100;
    item.personalShare = Math.round(item.personalShare * 100) / 100;
    item.netBalance = Math.round((item.totalPaid - item.personalShare) * 100) / 100;
  });

  return map;
}

/**
 * Generates personal folder / ledger records dynamically for a specific member.
 * Zero duplicate data entry - derived directly from group expenses.
 */
export function getMemberPersonalLedger(memberId, expenses, members) {
  const memberMap = new Map(members.map(m => [m.id, m]));
  const personalRecords = [];

  expenses.forEach(exp => {
    const isPayer = exp.paidBy === memberId;
    const participantInfo = exp.participants?.find(p => p.memberId === memberId);
    const isParticipant = !!participantInfo;

    // Only include if member is involved either as payer or participant
    if (isPayer || isParticipant) {
      const amountPaidByMe = isPayer ? Number(exp.amount) : 0;
      const myShare = participantInfo ? Number(participantInfo.share) : 0;
      const netImpact = amountPaidByMe - myShare;

      personalRecords.push({
        expenseId: exp.id,
        description: exp.description,
        category: exp.category,
        date: exp.date,
        time: exp.time,
        totalAmount: Number(exp.amount),
        isPayer,
        payerName: memberMap.get(exp.paidBy)?.name || 'Unknown',
        amountPaidByMe,
        myShare,
        netImpact,
        participantCount: exp.participants?.length || 0,
        participants: exp.participants || [],
      });
    }
  });

  // Sort chronological descending (newest first)
  personalRecords.sort((a, b) => {
    const dateA = new Date(a.date + (a.time ? `T${a.time}` : 'T00:00:00')).getTime();
    const dateB = new Date(b.date + (b.time ? `T${b.time}` : 'T00:00:00')).getTime();
    return dateB - dateA;
  });

  return personalRecords;
}

/**
 * Optimal Settlement Debt Simplification Algorithm.
 * Matches debtors and creditors to minimize total money transfer transactions.
 * Returns: Array of { fromMemberId, fromName, toMemberId, toName, amount }
 */
export function calculateOptimalSettlements(members, expenses) {
  const balances = calculateMemberBalances(members, expenses);
  const memberMap = new Map(members.map(m => [m.id, m]));

  const creditors = [];
  const debtors = [];

  Object.values(balances).forEach(b => {
    // Use threshold of 0.01 to eliminate floating point noise
    if (b.netBalance > 0.01) {
      creditors.push({
        id: b.member.id,
        name: b.member.name,
        amount: b.netBalance,
      });
    } else if (b.netBalance < -0.01) {
      debtors.push({
        id: b.member.id,
        name: b.member.name,
        amount: Math.abs(b.netBalance),
      });
    }
  });

  // Sort descending by amount for efficient matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const settleAmount = Math.min(creditor.amount, debtor.amount);
    const roundedAmount = Math.round(settleAmount * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        fromMemberId: debtor.id,
        fromName: debtor.name,
        toMemberId: creditor.id,
        toName: creditor.name,
        amount: roundedAmount,
      });
    }

    creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;
    debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;

    if (creditor.amount <= 0.009) {
      cIdx++;
    }
    if (debtor.amount <= 0.009) {
      dIdx++;
    }
  }

  return transactions;
}

/**
 * Calculates weekly summary for a given week bounds:
 * - Total group spent in week
 * - Per member spending in week (either by amount actually paid or personal share)
 * - Identifies the "Lowest Spender of the Week"
 * - Handles ties seamlessly (multiple members sharing lowest spend)
 */
export function calculateWeeklySummary(members, expenses, weekBounds, criteria = 'paid') {
  const memberMap = new Map(members.map(m => [m.id, m]));
  const spendingMap = {};

  members.forEach(m => {
    spendingMap[m.id] = {
      member: m,
      spent: 0,
      paidAmount: 0,
      personalShare: 0,
      expenseCount: 0,
    };
  });

  let totalWeeklySpent = 0;
  let weeklyExpenseCount = 0;

  expenses.forEach(exp => {
    if (!exp.date) return;
    const expDate = new Date(exp.date + 'T00:00:00');

    if (expDate >= weekBounds.start && expDate <= weekBounds.end) {
      const amt = Number(exp.amount) || 0;
      totalWeeklySpent += amt;
      weeklyExpenseCount += 1;

      // Track paid amount
      if (spendingMap[exp.paidBy]) {
        spendingMap[exp.paidBy].paidAmount += amt;
        spendingMap[exp.paidBy].expenseCount += 1;
      }

      // Track personal share
      if (Array.isArray(exp.participants)) {
        exp.participants.forEach(p => {
          if (spendingMap[p.memberId]) {
            spendingMap[p.memberId].personalShare += Number(p.share) || 0;
          }
        });
      }
    }
  });

  // Assign criteria value
  const memberSpends = members.map(m => {
    const data = spendingMap[m.id];
    const spentValue = criteria === 'share' ? data.personalShare : data.paidAmount;
    return {
      member: m,
      spent: Math.round(spentValue * 100) / 100,
      paidAmount: Math.round(data.paidAmount * 100) / 100,
      personalShare: Math.round(data.personalShare * 100) / 100,
      expenseCount: data.expenseCount,
    };
  });

  // Sort descending by spending for the ranking view
  memberSpends.sort((a, b) => b.spent - a.spent);

  // Find lowest spender(s)
  let lowestMembers = [];
  let lowestSpent = 0;

  if (memberSpends.length > 0) {
    // Find min value
    const minSpentVal = Math.min(...memberSpends.map(s => s.spent));
    lowestSpent = minSpentVal;
    lowestMembers = memberSpends.filter(s => s.spent === minSpentVal).map(s => s.member);
  }

  return {
    weekBounds,
    totalWeeklySpent: Math.round(totalWeeklySpent * 100) / 100,
    weeklyExpenseCount,
    memberSpends,
    lowestMembers,
    lowestSpent,
    isTie: lowestMembers.length > 1,
    criteria,
  };
}

/**
 * Calculates monthly statistics and summaries
 */
export function calculateMonthlySummary(members, expenses, monthKey) {
  // monthKey = "YYYY-MM"
  const monthlyExpenses = expenses.filter(e => e.date && e.date.startsWith(monthKey));

  let totalGroupSpent = 0;
  const memberPaidMap = {};
  const categoryMap = {};

  members.forEach(m => {
    memberPaidMap[m.id] = { member: m, amount: 0, count: 0 };
  });

  monthlyExpenses.forEach(exp => {
    const amt = Number(exp.amount) || 0;
    totalGroupSpent += amt;

    if (memberPaidMap[exp.paidBy]) {
      memberPaidMap[exp.paidBy].amount += amt;
      memberPaidMap[exp.paidBy].count += 1;
    }

    const cat = exp.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + amt;
  });

  const memberRankings = Object.values(memberPaidMap).sort((a, b) => b.amount - a.amount);
  const highestSpender = memberRankings[0] || null;
  const lowestSpender = memberRankings[memberRankings.length - 1] || null;

  // Most common category
  let mostCommonCategory = 'None';
  let maxCatAmount = 0;
  Object.entries(categoryMap).forEach(([cat, amount]) => {
    if (amount > maxCatAmount) {
      maxCatAmount = amount;
      mostCommonCategory = cat;
    }
  });

  const averageExpense = monthlyExpenses.length > 0
    ? Math.round((totalGroupSpent / monthlyExpenses.length) * 100) / 100
    : 0;

  return {
    monthKey,
    totalGroupSpent: Math.round(totalGroupSpent * 100) / 100,
    transactionCount: monthlyExpenses.length,
    memberRankings,
    highestSpender,
    lowestSpender,
    mostCommonCategory,
    categoryBreakdown: categoryMap,
    averageExpense,
  };
}
