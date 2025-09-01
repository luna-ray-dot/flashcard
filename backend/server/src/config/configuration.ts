export default () => ({
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    user: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'myStrongPassword123',
    encrypted: false,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretkey',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  ai: {
    baseDelayMs: parseInt(process.env.AI_BASE_DELAY_MS || '2200'),
    baseAccuracy: parseFloat(process.env.AI_BASE_ACCURACY || '0.78'),
  },
});
