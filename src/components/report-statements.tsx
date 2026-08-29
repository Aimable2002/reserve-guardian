import {
  balanceSheet,
  cashFlowStatement,
  equityStatement,
  incomeStatement,
} from "@/lib/reports-data";
import {
  GrandTotalRow,
  SectionHeader,
  StatementRow,
  SubSectionHeader,
  TotalRow,
} from "@/components/report-ui";
import { useReportsStore } from "@/lib/reports-store";

/**
 * Reusable bodies for the four primary financial statements. The standalone
 * pages (Income Statement, Balance Sheet, Cash Flow, Changes in Equity) and
 * the bundled Financial Report both render these, so the figures are always
 * identical between views.
 */

export function IncomeStatementBody() {
  const { entries, accounts } = useReportsStore();
  const is = incomeStatement(entries, accounts);
  return (
    <div>
      <SectionHeader>Revenue</SectionHeader>
      {is.revenue.map((l) => (
        <StatementRow key={l.code} label={l.name} amount={l.amount} indent />
      ))}
      <TotalRow label="Total Revenue" amount={is.totalRevenue} />

      <SectionHeader>Expenses</SectionHeader>
      <SubSectionHeader>Operating Expenses</SubSectionHeader>
      {is.operatingExpenses.map((l) => (
        <StatementRow key={l.code} label={l.name} amount={l.amount} indent />
      ))}
      <TotalRow label="Total Operating Expenses" amount={is.totalOperating} />
      <SubSectionHeader>Other Expenses</SubSectionHeader>
      {is.otherExpenses.map((l) => (
        <StatementRow key={l.code} label={l.name} amount={l.amount} indent />
      ))}
      <TotalRow label="Total Other Expenses" amount={is.totalOther} />
      <TotalRow label="Total Expenses" amount={is.totalExpenses} />

      <div className="mt-6">
        <GrandTotalRow label="Net Income" amount={is.netIncome} />
      </div>
    </div>
  );
}

export function BalanceSheetBody() {
  const { entries, accounts } = useReportsStore();
  const bs = balanceSheet(entries, accounts);
  return (
    <div>
      <SectionHeader>Assets</SectionHeader>
      <SubSectionHeader>Current Assets</SubSectionHeader>
      {bs.currentAssets.map((l) => (
        <StatementRow key={l.code} label={l.name} amount={l.amount} indent />
      ))}
      <TotalRow label="Total Current Assets" amount={bs.totalCurrentAssets} />
      <SubSectionHeader>Non-Current Assets</SubSectionHeader>
      {bs.nonCurrentAssets.map((l) => (
        <StatementRow key={l.code} label={l.name} amount={l.amount} indent />
      ))}
      <TotalRow label="Total Non-Current Assets" amount={bs.totalNonCurrentAssets} />
      <GrandTotalRow label="Total Assets" amount={bs.totalAssets} />

      <SectionHeader>Liabilities</SectionHeader>
      <SubSectionHeader>Current Liabilities</SubSectionHeader>
      {bs.currentLiabilities.length === 0 ? (
        <StatementRow label="Accounts Payable" amount={0} indent />
      ) : (
        bs.currentLiabilities.map((l) => (
          <StatementRow key={l.code} label={l.name} amount={l.amount} indent />
        ))
      )}
      <TotalRow label="Total Current Liabilities" amount={bs.totalCurrentLiabilities} />
      <SubSectionHeader>Non-Current Liabilities</SubSectionHeader>
      {bs.nonCurrentLiabilities.map((l) => (
        <StatementRow key={l.code} label={l.name} amount={l.amount} indent />
      ))}
      <TotalRow label="Total Non-Current Liabilities" amount={bs.totalNonCurrentLiabilities} />
      <TotalRow label="Total Liabilities" amount={bs.totalLiabilities} />

      <SectionHeader>Equity</SectionHeader>
      <StatementRow label="Owner's Capital" amount={bs.capital} indent />
      <StatementRow label="Net Income for the Period" amount={bs.netIncome} indent />
      <StatementRow label="Less: Owner's Draws" amount={bs.draws} indent negative />
      <TotalRow label="Total Equity" amount={bs.totalEquity} />

      <div className="mt-6">
        <GrandTotalRow label="Total Liabilities and Equity" amount={bs.totalLiabilitiesAndEquity} />
      </div>
    </div>
  );
}

export function CashFlowBody() {
  const { entries, accounts } = useReportsStore();
  const cf = cashFlowStatement(entries, accounts);
  return (
    <div>
      <SectionHeader>Operating Activities</SectionHeader>
      {cf.operating.map((l) => (
        <StatementRow key={l.name} label={l.name} amount={l.amount} indent />
      ))}
      <TotalRow label="Net Cash from Operating Activities" amount={cf.netOperating} />

      <SectionHeader>Investing Activities</SectionHeader>
      {cf.investing.map((l) => (
        <StatementRow key={l.name} label={l.name} amount={l.amount} indent />
      ))}
      <TotalRow label="Net Cash from Investing Activities" amount={cf.netInvesting} />

      <SectionHeader>Financing Activities</SectionHeader>
      {cf.financing.map((l) => (
        <StatementRow key={l.name} label={l.name} amount={l.amount} indent />
      ))}
      <TotalRow label="Net Cash from Financing Activities" amount={cf.netFinancing} />

      <div className="mt-6">
        <GrandTotalRow label="Net Change in Cash" amount={cf.netChange} />
        <div className="mt-3">
          <StatementRow label="Cash at Beginning of Period" amount={cf.beginningCash} indent />
          <TotalRow label="Cash at End of Period" amount={cf.endingCash} />
        </div>
      </div>
    </div>
  );
}

export function EquityStatementBody() {
  const { entries, accounts } = useReportsStore();
  const eq = equityStatement(entries, accounts);
  return (
    <div>
      <SectionHeader>Statement of Changes in Equity</SectionHeader>
      <StatementRow label="Opening Equity, July 1, 2026" amount={eq.openingCapital} />
      <StatementRow label="Add: Capital Contributions" amount={eq.contributions} indent />
      <StatementRow label="Add: Net Income for the Period" amount={eq.netIncome} indent />
      <StatementRow label="Less: Owner's Withdrawals / Draws" amount={eq.draws} indent negative />
      <div className="mt-4">
        <GrandTotalRow label="Closing Equity, July 31, 2026" amount={eq.closingEquity} />
      </div>
    </div>
  );
}
