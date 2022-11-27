import { Knex } from "knex";

const tableName = "labels";
exports.up = function (knex: Knex) {
  return knex.schema.createTable(tableName, (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.uuid("user_id").references("id").inTable("users").index().notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex: Knex) {
  return knex.schema.dropTable(tableName);
};
