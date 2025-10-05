// scripts/backfill-workflows.js
const db = require('../_helpers/db');

(async () => {

    // 🧠 Wait a short moment for db.js to finish initializing
  await new Promise(resolve => setTimeout(resolve, 500));

  await db.sequelize.authenticate();

  console.log('✅ Connected to DB');

  const requests = await db.Request.findAll();
  for (const req of requests) {
    const existing = await db.Workflow.findOne({ where: { requestId: req.id } });
    if (!existing) {
      await db.Workflow.create({
        type: 'Request Approval',
        details: `Request for ${request.type}: ${JSON.stringify(request.items)}`,
        employeeId: req.employeeId,
        requestId: req.id,
        status: req.status || 'Pending'
      });
      console.log(`✅ Workflow created for request #${req.id}`);
    }
  }

  console.log('Backfill complete.');
  process.exit();
})();

