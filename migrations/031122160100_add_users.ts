import { Knex } from "knex";

const tableName = "users";
exports.up = function (knex: Knex) {
  return knex.schema.createTable(tableName, (table) => {
    table.uuid("id").primary();
    table.string("email").notNullable().unique();
    table.string("hashed_password").notNullable();
    table.string("salt").notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex: Knex) {
  return knex.schema.dropTable(tableName);
};
