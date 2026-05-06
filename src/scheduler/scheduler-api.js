/**
 * Scheduler API Endpoints
 */

const express = require('express');
const router = express.Router();
const { ScrapeScheduler, SCHEDULE_TEMPLATES } = require('./cron-scheduler');

let scheduler;

function initScheduler() {
  scheduler = new ScrapeScheduler();
  return scheduler;
}

// Get all schedules
router.get('/schedules', async (req, res) => {
  const schedules = await scheduler.getAllSchedules();
  res.json({ success: true, data: schedules });
});

// Create new schedule
router.post('/schedules', async (req, res) => {
  const { name, platform, frequency, cronExpression, target, params, webhookUrl } = req.body;
  
  const schedule = await scheduler.createSchedule({
    name,
    platform,
    frequency,
    cronExpression,
    target,
    params,
    webhookUrl
  });
  
  res.json({ success: true, data: schedule });
});

// Get schedule templates
router.get('/schedules/templates', (req, res) => {
  res.json({ success: true, data: SCHEDULE_TEMPLATES });
});

// Apply template
router.post('/schedules/templates/:templateName', async (req, res) => {
  const { templateName } = req.params;
  const template = SCHEDULE_TEMPLATES[templateName];
  
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  const schedule = await scheduler.createSchedule(template);
  res.json({ success: true, data: schedule });
});

// Update schedule
router.put('/schedules/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const schedule = await scheduler.updateSchedule(parseInt(id), updates);
  res.json({ success: true, data: schedule });
});

// Delete schedule
router.delete('/schedules/:id', async (req, res) => {
  const { id } = req.params;
  await scheduler.deleteSchedule(parseInt(id));
  res.json({ success: true, message: 'Schedule deleted' });
});

// Run schedule now
router.post('/schedules/:id/run', async (req, res) => {
  const { id } = req.params;
  const result = await scheduler.runNow(parseInt(id));
  res.json({ success: true, data: result });
});

// Get execution history
router.get('/executions', async (req, res) => {
  const { scheduleId, limit = 50 } = req.query;
  
  const executions = await prisma.scrapeExecution.findMany({
    where: scheduleId ? { scheduleId: parseInt(scheduleId) } : {},
    orderBy: { executedAt: 'desc' },
    take: parseInt(limit),
    include: { schedule: true }
  });
  
  res.json({ success: true, data: executions });
});

module.exports = { schedulerRouter: router, initScheduler };