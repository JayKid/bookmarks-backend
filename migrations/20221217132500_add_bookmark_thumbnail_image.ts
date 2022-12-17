import { Knex } from "knex";

const tableName = "bookmarks";
exports.up = async (knex: Knex) => {
  return knex.schema.alterTable(tableName, function (t) {
    t.string("thumbnail").nullable();
  })
};

exports.down = function (knex: Knex) {
  return knex.schema.alterTable(tableName, function (t) {
    t.dropColumn("thumbnail");
  });
};
