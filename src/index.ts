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
import morgan from 'morgan';
import { logger } from './utils/logger';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

dotenv.config();

export const app = express();

async function startServer() {

  try {
    await initializeDatabase();
    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error(`Failed to start server due to database connection error: ${(err as any).message}`);
    process.exit(1);
  }

  // Setup HTTP request logging via Morgan, piping stream to Winston
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

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
        swagger_docs: '/docs',
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

  // Mount Swagger UI Documentation
  const swaggerDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use('/graphql', expressMiddleware(server));

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    logger.info(`Server ready at http://localhost:${PORT}/graphql`);
  });
}

if (require.main === module) {
  startServer();
}
