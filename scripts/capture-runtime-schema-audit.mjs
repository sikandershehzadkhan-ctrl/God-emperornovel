import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const DATABASE = 'god-emperornovel-db';
const OUTPUT_DIR = 'audit-output';
const RAW_OUTPUT = `${OUTPUT_DIR}/wrangler-schema-evidence.json`;
const DIAGNOSTICS = `${OUTPUT_DIR}/schema-capture-diagnostics.json`;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const diagnostics = [];

function findResults(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);
  if (!Array.isArray(value)) {
    if (Array.isArray(value.results)) return value.results;
    for (const child of Object.values(value)) {
      const found = findResults(child, seen);
      if (found) return found;
    }
  } else {
    for (const child of value) {
      const found = findResults(child, seen);
      if (found) return found;
    }
  }
  return null;
}

function runReadOnly(label, sql) {
  try {
    const stdout = execFileSync('npx', [
      '--yes', 'wrangler@4', 'd1', 'execute', DATABASE,
      '--remote', '--command', sql, '--json'
    ], {
      encoding: 'utf8',
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 32 * 1024 * 1024
    });
    const parsed = JSON.parse(stdout);
    const rows = findResults(parsed);
    if (!rows) throw new Error('Wrangler JSON did not contain a results array.');
    return rows;
  } catch (error) {
    const entry = {
      operation: label,
      message: String(error.message || error),
      stdout: error.stdout ? String(error.stdout).slice(0, 12000) : '',
      stderr: error.stderr ? String(error.stderr).slice(0, 12000) : ''
    };
    diagnostics.push(entry);
    fs.writeFileSync(DIAGNOSTICS, JSON.stringify({ completed: false, failures: diagnostics }, null, 2) + '\n');
    throw new Error('Read-only schema inspection failed at "' + label + '". See ' + DIAGNOSTICS + ' for the captured diagnostic.');
  }
}

function quoteIdentifier(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

// Cloudflare-managed D1 internals (for example, _cf_KV) may appear in
// sqlite_master but are not exposed to customer-issued PRAGMA inspection.
// Exclude platform-owned objects; this audit covers the application schema.
const objects = runReadOnly(
  'sqlite_master application table and index inventory',
  "SELECT type,name,tbl_name,sql FROM sqlite_master WHERE type IN ('table','index','trigger') AND name NOT LIKE 'sqlite_%' AND substr(name,1,4) <> '_cf_' AND substr(tbl_name,1,4) <> '_cf_' ORDER BY type,tbl_name,name;"
);
const tableObjects = objects.filter(row => row.type === 'table');
const explicitIndexes = objects.filter(row => row.type === 'index' && row.sql !== null);
const triggerObjects = objects.filter(row => row.type === 'trigger' && row.sql !== null);
const triggers = triggerObjects.map(row => ({ name: row.name, table: row.tbl_name, sql: row.sql }));
if (!tableObjects.length) throw new Error('The production schema inventory returned no user tables.');

const tables = [];
const tableIndexes = [];
const foreignKeys = [];
const indexDetails = new Map();

for (const tableObject of tableObjects) {
  const tableName = tableObject.name;
  const identifier = quoteIdentifier(tableName);
  const columns = runReadOnly('table_info: ' + tableName, 'PRAGMA table_info(' + identifier + ');')
    .map(row => ({
      name: row.name,
      type: row.type,
      notnull: Number(row.notnull),
      dflt_value: row.dflt_value ?? null,
      pk: Number(row.pk)
    }));

  const tableForeignKeys = runReadOnly('foreign_key_list: ' + tableName, 'PRAGMA foreign_key_list(' + identifier + ');')
    .map(row => ({
      id: Number(row.id), seq: Number(row.seq), table: row.table,
      from: row.from, to: row.to, on_update: row.on_update,
      on_delete: row.on_delete, match: row.match
    }));
  for (const fk of tableForeignKeys) foreignKeys.push({ table: tableName, ...fk });

  const listedIndexes = runReadOnly('index_list: ' + tableName, 'PRAGMA index_list(' + identifier + ');');
  for (const listed of listedIndexes) {
    const indexName = listed.name;
    const indexColumns = runReadOnly(
      'index_info: ' + indexName,
      'PRAGMA index_info(' + quoteIdentifier(indexName) + ');'
    ).sort((a, b) => Number(a.seqno) - Number(b.seqno)).map(row => row.name ?? null);

    const detail = {
      name: indexName,
      table: tableName,
      unique: Number(listed.unique),
      origin: listed.origin,
      partial: Number(listed.partial),
      columns: indexColumns
    };
    tableIndexes.push(detail);
    indexDetails.set(indexName, detail);
  }

  tables.push({
    name: tableName,
    sql: tableObject.sql,
    columns,
    foreignKeys: tableForeignKeys
  });
}

const indexes = explicitIndexes.map(index => {
  const detail = indexDetails.get(index.name);
  if (!detail) throw new Error('Explicit index was absent from PRAGMA index_list: ' + index.name);
  return {
    name: index.name,
    table: index.tbl_name,
    sql: index.sql,
    unique: detail.unique,
    columns: detail.columns
  };
});

const evidence = {
  database: DATABASE,
  auditedAt: new Date().toISOString(),
  inventoryComplete: true,
  tables,
  indexes,
  tableIndexes,
  foreignKeys,
  triggers
};

// Keep the normalizer's established Wrangler JSON envelope unchanged.
fs.writeFileSync(
  RAW_OUTPUT,
  JSON.stringify([{ results: [{ schema_evidence: JSON.stringify(evidence) }], success: true }], null, 2) + '\n',
  { flag: 'w' }
);
fs.writeFileSync(DIAGNOSTICS, JSON.stringify({
  completed: true,
  tableCount: tables.length,
  explicitIndexCount: indexes.length,
  tableIndexCount: tableIndexes.length,
  foreignKeyCount: foreignKeys.length,
  triggerCount: triggers.length,
  method: 'separate read-only sqlite_master and PRAGMA statements'
}, null, 2) + '\n');

console.log('Captured complete schema metadata using separate read-only SQLite metadata statements.');
console.log('Tables: ' + tables.length + '; explicit indexes: ' + indexes.length + '; table indexes: ' + tableIndexes.length + '; foreign keys: ' + foreignKeys.length + '.');
