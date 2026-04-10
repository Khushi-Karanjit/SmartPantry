/**
 * Generates an HTML Email Template for the Full Kitchen Status Report
 */
const generateFullReportEmail = (report, username) => {
  const lowStockRows = report.inventoryDetails.lowStock.map(i => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${i.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #f59e0b; font-weight: bold;">${i.qty} ${i.unit} left</td>
    </tr>
  `).join("");

  const expiryRows = report.inventoryDetails.expiringSoon.map(i => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${i.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #ef4444; font-weight: bold;">Attention Required</td>
    </tr>
  `).join("");

  return `
    <div style="font-family: sans-serif; color: #1e293b; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: #f8fafc; padding: 40px; border-bottom: 2px solid #f1f5f9;">
        <h1 style="margin: 0; color: #0f172a; font-size: 28px;">Kitchen Status Audit 🏛️</h1>
        <p style="color: #64748b; margin-top: 8px;">Hi ${username}, here is your automated 24-hour kitchen briefing.</p>
      </div>

      <div style="padding: 40px;">
        <!-- Health Score -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
          <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #3b82f6; font-weight: 700;">Overall Kitchen Health Score</p>
          <p style="margin: 8px 0 0 0; font-size: 48px; font-weight: 800; color: #2563eb;">${report.summary.efficiencyScore}%</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
           <div style="background: #fdf2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 12px;">
              <h3 style="margin: 0; color: #991b1b; font-size: 16px;">Expiry Risks</h3>
              <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 800; color: #b91c1c;">${report.summary.expiryRiskCount}</p>
           </div>
           <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 12px;">
              <h3 style="margin: 0; color: #92400e; font-size: 16px;">Low Stock</h3>
              <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 800; color: #b45309;">${report.summary.lowStockCount}</p>
           </div>
        </div>

        <!-- Details -->
        <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">Critical Action Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
           ${expiryRows}
           ${lowStockRows}
           ${report.summary.expiryRiskCount === 0 && report.summary.lowStockCount === 0 ? '<tr><td colspan="2" style="padding: 20px; text-align: center; color: #64748b;">All clear! Your kitchen is in perfect shape.</td></tr>' : ''}
        </table>

        <!-- Nutrition -->
        <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">Weekly Nutritional Snapshot</h3>
        <div style="background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
           <table style="width: 100%;">
              <tr>
                <td><strong>Weekly Total Calories:</strong></td>
                <td style="text-align: right;">${report.nutrition.weeklyCalories.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Weekly Total Protein:</strong></td>
                <td style="text-align: right;">${report.nutrition.weeklyProtein.toLocaleString()}g</td>
              </tr>
              <tr>
                <td><strong>Avg. Daily Calories:</strong></td>
                <td style="text-align: right;">${report.nutrition.avgDailyCals.toLocaleString()}</td>
              </tr>
           </table>
        </div>

        <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">
          Generated on ${new Date(report.generatedAt).toLocaleString()} • SmartPantry Autonomous Intelligence
        </p>
      </div>
    </div>
  `;
};

module.exports = { generateFullReportEmail };
