#!/usr/bin/env node
// Usage:
//   node backup-keyring.js backup <output-file>    — dump address\tmnemonic pairs
//   node backup-keyring.js restore <input-file>     — restore mnemonics from backup
//   node backup-keyring.js count                    — print number of accounts in wallet.db
//   node backup-keyring.js verify                   — check which accounts have mnemonics in keyring

const { Entry } = require('@napi-rs/keyring');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

const KEYCHAIN_SERVICE = 'algorand-mcp';
const WALLET_DB = path.join(os.homedir(), '.algorand-mcp', 'wallet.db');

async function getAccounts() {
  if (!fs.existsSync(WALLET_DB)) return [];
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(WALLET_DB);
  const db = new SQL.Database(buf);
  const rows = db.exec('SELECT address FROM accounts');
  db.close();
  if (!rows.length || !rows[0].values.length) return [];
  return rows[0].values.map(r => r[0]);
}

function getMnemonic(address) {
  try {
    const entry = new Entry(KEYCHAIN_SERVICE, address);
    const pw = entry.getPassword();
    return pw || null;
  } catch {
    return null;
  }
}

function setMnemonic(address, mnemonic) {
  const entry = new Entry(KEYCHAIN_SERVICE, address);
  entry.setPassword(mnemonic);
}

async function main() {
  const mode = process.argv[2];
  const file = process.argv[3];

  if (mode === 'count') {
    const accounts = await getAccounts();
    console.log(accounts.length);
    return;
  }

  if (mode === 'verify') {
    const accounts = await getAccounts();
    let ok = 0, missing = 0;
    for (const addr of accounts) {
      if (getMnemonic(addr)) {
        console.log('OK ' + addr);
        ok++;
      } else {
        console.log('MISSING ' + addr);
        missing++;
      }
    }
    console.log(`TOTAL=${accounts.length} OK=${ok} MISSING=${missing}`);
    return;
  }

  if (mode === 'backup') {
    if (!file) { console.error('Usage: backup-keyring.js backup <output-file>'); process.exit(1); }
    const accounts = await getAccounts();
    if (accounts.length === 0) {
      console.log('NO_ACCOUNTS');
      return;
    }
    let backed = 0, failed = 0;
    const lines = [];
    for (const addr of accounts) {
      const mnemonic = getMnemonic(addr);
      if (mnemonic) {
        lines.push(addr + '\t' + mnemonic);
        backed++;
      } else {
        console.error('MISSING ' + addr);
        failed++;
      }
    }
    if (lines.length > 0) {
      fs.writeFileSync(file, lines.join('\n') + '\n', { mode: 0o600 });
    }
    console.log(`BACKED_UP=${backed} FAILED=${failed}`);
    return;
  }

  if (mode === 'restore') {
    if (!file) { console.error('Usage: backup-keyring.js restore <input-file>'); process.exit(1); }
    if (!fs.existsSync(file)) { console.error('File not found: ' + file); process.exit(1); }
    const content = fs.readFileSync(file, 'utf-8').trim();
    if (!content) { console.log('RESTORED=0'); return; }
    let restored = 0;
    for (const line of content.split('\n')) {
      const [addr, ...rest] = line.split('\t');
      const mnemonic = rest.join('\t');
      if (addr && mnemonic) {
        setMnemonic(addr, mnemonic);
        restored++;
      }
    }
    console.log(`RESTORED=${restored}`);
    return;
  }

  console.error('Usage: backup-keyring.js <backup|restore|count|verify> [file]');
  process.exit(1);
}

main().catch(err => { console.error(err.message); process.exit(1); });
