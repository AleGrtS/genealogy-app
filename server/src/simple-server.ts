import express from 'express';

const app = express();
const PORT = 3001;

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`✅ Simple server running on port ${PORT}`);
  console.log(`   Test: curl http://localhost:${PORT}/api/health`);
});
