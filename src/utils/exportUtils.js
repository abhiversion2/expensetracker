// Utilities for generating and downloading CSV and JSON reports

/**
 * Escapes fields for CSV format
 */
function escapeCsv(str) {
  if (str === null || str === undefined) return '""';
  const val = String(str).replace(/"/g, '""');
  return `"${val}"`;
}

/**
 * Initiates browser download of a file
 */
export function downloadFile(content, fileName, contentType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports complete Group Expense Report to CSV
 */
export function exportGroupExpensesCsv(expenses, members, groupName = 'Apna Gang') {
  const memberMap = new Map(members.map(m => [m.id, m.name]));

  const headers = [
    'Date',
    'Time',
    'Description',
    'Category',
    'Total Amount',
    'Paid By',
    'Participants Count',
    'Participants',
    'Individual Shares Breakdown',
    'Notes',
  ];

  const rows = expenses.map(exp => {
    const payerName = memberMap.get(exp.paidBy) || exp.paidBy;
    const participantNames = (exp.participants || [])
      .map(p => memberMap.get(p.memberId) || p.memberId)
      .join(', ');

    const sharesBreakdown = (exp.participants || [])
      .map(p => `${memberMap.get(p.memberId) || p.memberId}: ${p.share}`)
      .join('; ');

    return [
      escapeCsv(exp.date),
      escapeCsv(exp.time || ''),
      escapeCsv(exp.description),
      escapeCsv(exp.category || 'Other'),
      exp.amount,
      escapeCsv(payerName),
      exp.participants?.length || 0,
      escapeCsv(participantNames),
      escapeCsv(sharesBreakdown),
      escapeCsv(exp.notes || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `${groupName.replace(/\s+/g, '_')}_Expenses_${dateStr}.csv`);
}

/**
 * Exports a Personal Expense Ledger to CSV
 */
export function exportPersonalLedgerCsv(member, personalLedger, currency = '₹') {
  const headers = [
    'Date',
    'Time',
    'Description',
    'Category',
    'Total Bill Amount',
    'Paid By Me (Yes/No)',
    'Amount Paid By Me',
    'My Personal Share',
    'Net Impact',
    'Payer Name',
    'Total Participants',
  ];

  const rows = personalLedger.map(rec => {
    return [
      escapeCsv(rec.date),
      escapeCsv(rec.time || ''),
      escapeCsv(rec.description),
      escapeCsv(rec.category || 'Other'),
      rec.totalAmount,
      rec.isPayer ? 'Yes' : 'No',
      rec.amountPaidByMe,
      rec.myShare,
      rec.netImpact,
      escapeCsv(rec.payerName),
      rec.participantCount,
    ].join(',');
  });

  const totalPaid = personalLedger.reduce((sum, r) => sum + r.amountPaidByMe, 0);
  const totalShare = personalLedger.reduce((sum, r) => sum + r.myShare, 0);
  const netBalance = totalPaid - totalShare;

  const summary = [
    '',
    `"SUMMARY FOR ${member.name}"`,
    `"Total Amount Paid",${totalPaid}`,
    `"Total Personal Share",${totalShare}`,
    `"Net Balance (Positive = to receive, Negative = owes)",${netBalance}`,
  ].join('\n');

  const csvContent = [headers.join(','), ...rows, summary].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `${member.name}_Personal_Ledger_${dateStr}.csv`);
}
