import { Knex } from "knex";

const tableName = "lists_bookmarks";
exports.up = async (knex: Knex) => {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid("id").primary();
    table.uuid("bookmark_id").references("id").inTable("bookmarks").index().notNullable().onDelete('CASCADE');
    table.uuid("list_id").references("id").inTable("lists").index().notNullable().onDelete('CASCADE');
    table.timestamps(true, true);
  });

  return knex.schema.alterTable(tableName, function (t) {
    t.unique(['bookmark_id', 'list_id'], { indexName: 'lists_bookmarks_composite_index' })
  });
};

exports.down = function (knex: Knex) {
  return knex.schema.dropTable(tableName);
}; 