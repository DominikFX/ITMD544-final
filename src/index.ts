import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/init';
import path from 'path';
import restRouter from './routes/rest';

dotenv.config();

async function startServer() {
  const app = express();

  try {
    await initializeDatabase();
  } catch (err) {
    console.error('Failed to start server due to database connection error:', err);
    process.exit(1);
  }

  // Serve static frontend files under /client
  app.use('/client', express.static(path.join(__dirname, '../public')));

  // Root endpoint for API status
  app.get('/', (req, res) => {
    res.json({
      name: 'A/V Equipment Vault API',
      status: 'online',
      version: '1.0.0',
      links: {
        graphql_sandbox: '/graphql',
        rest_api_base: '/api',
        frontend_client: '/client'
      }
    });
  });

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(cors());
  app.use(express.json());

  // Mount standard REST endpoints
  app.use('/api', restRouter);

  app.use('/graphql', expressMiddleware(server));

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}/graphql`);
  });
}

startServer();
