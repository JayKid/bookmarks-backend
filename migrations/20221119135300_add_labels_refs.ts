import { Knex } from "knex";

const tableName = "labels_bookmarks";
exports.up = async (knex: Knex) => {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid("id").primary(); // unnecessary?
    table.uuid("bookmark_id").references("id").inTable("bookmarks").index().notNullable();
    table.uuid("label_id").references("id").inTable("labels").index().notNullable();
    table.timestamps(true, true);
  });

  return knex.schema.alterTable(tableName, function (t) {
    t.unique(['bookmark_id', 'label_id'], { indexName: 'labels_bookmarks_composite_index' })
  })
};

exports.down = function (knex: Knex) {
  return knex.schema.dropTable(tableName);
};
