export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DATABASE_HOST || 'localbook-db',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    url: process.env.DATABASE_URL,
  },
});
