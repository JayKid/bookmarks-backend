import type { Knex } from "knex";
import appConfig from "./config";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: {
      database: appConfig.knex.database,
      user: appConfig.knex.user,
      password: appConfig.knex.password
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  },

  production: {
    client: "postgresql",
    connection: {
      database: appConfig.knex.database,
      user: appConfig.knex.user,
      password: appConfig.knex.password
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }

};

module.exports = config;
