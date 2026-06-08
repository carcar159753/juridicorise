const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'rise_juridico.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
}
async function columnExists(table, column) {
  const cols = await all(`PRAGMA table_info(${table})`);
  return cols.some(c => c.name === column);
}
async function addColumn(table, column, def) {
  if (!(await columnExists(table, column))) await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
}

async function init() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS processos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT,
    acusado_nome TEXT NOT NULL,
    acusado_id TEXT,
    acusado_telefone TEXT,
    acusado_sexo TEXT,
    vitima_nome TEXT,
    vitima_id TEXT,
    vitima_telefone TEXT,
    vitima_sexo TEXT,
    advogado TEXT,
    juiz TEXT,
    descricao TEXT NOT NULL,
    decisao TEXT,
    status TEXT DEFAULT 'Aberto',
    created_by INTEGER,
    updated_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS portes_armas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cidadao_id TEXT,
    telefone TEXT,
    sexo TEXT,
    motivo TEXT,
    validade TEXT,
    status TEXT DEFAULT 'Em análise',
    created_by INTEGER,
    updated_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS trocas_nome (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_atual TEXT NOT NULL,
    nome_novo TEXT NOT NULL,
    cidadao_id TEXT,
    telefone TEXT,
    sexo TEXT,
    motivo TEXT,
    status TEXT DEFAULT 'Pendente',
    created_by INTEGER,
    updated_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS registros_familiares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_familia TEXT NOT NULL,
    lider_nome TEXT NOT NULL,
    lider_id TEXT,
    lider_telefone TEXT,
    lider_sexo TEXT,
    membros TEXT,
    descricao TEXT,
    status TEXT DEFAULT 'Registrado',
    created_by INTEGER,
    updated_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS mandados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alvo_nome TEXT NOT NULL,
    alvo_id TEXT,
    alvo_telefone TEXT,
    alvo_sexo TEXT,
    motivo TEXT NOT NULL,
    autoridade TEXT,
    status TEXT DEFAULT 'Ativo',
    created_by INTEGER,
    updated_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS audiencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    cidadao_nome TEXT,
    cidadao_id TEXT,
    cidadao_telefone TEXT,
    cidadao_sexo TEXT,
    data TEXT NOT NULL,
    horario TEXT NOT NULL,
    local TEXT,
    observacoes TEXT,
    status TEXT DEFAULT 'Marcada',
    created_by INTEGER,
    updated_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS pessoas_juridicas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    telefone TEXT,
    sexo TEXT,
    registro TEXT,
    status TEXT DEFAULT 'Ativo',
    created_by INTEGER,
    updated_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tabela TEXT NOT NULL,
    registro_id INTEGER,
    acao TEXT NOT NULL,
    usuario_id INTEGER,
    usuario_nome TEXT,
    detalhes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS anexos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tabela TEXT NOT NULL,
    registro_id INTEGER NOT NULL,
    original_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  const migrations = {
    processos: [
      ['acusado_nome', 'TEXT'], ['acusado_id', 'TEXT'], ['acusado_telefone', 'TEXT'], ['acusado_sexo', 'TEXT'],
      ['vitima_nome', 'TEXT'], ['vitima_id', 'TEXT'], ['vitima_telefone', 'TEXT'], ['vitima_sexo', 'TEXT'], ['decisao', 'TEXT'], ['created_by', 'INTEGER'], ['updated_at', 'TEXT']
    ],
    portes_armas: [['cidadao_id', 'TEXT'], ['sexo', 'TEXT'], ['validade', 'TEXT'], ['created_by', 'INTEGER'], ['updated_at', 'TEXT']],
    trocas_nome: [['cidadao_id', 'TEXT'], ['telefone', 'TEXT'], ['sexo', 'TEXT'], ['created_by', 'INTEGER'], ['updated_at', 'TEXT']],
    registros_familiares: [['lider_nome', 'TEXT'], ['lider_id', 'TEXT'], ['lider_telefone', 'TEXT'], ['lider_sexo', 'TEXT'], ['created_by', 'INTEGER'], ['updated_at', 'TEXT']],
    mandados: [['alvo_nome', 'TEXT'], ['alvo_id', 'TEXT'], ['alvo_telefone', 'TEXT'], ['alvo_sexo', 'TEXT'], ['created_by', 'INTEGER'], ['updated_at', 'TEXT']],
    audiencias: [['cidadao_nome', 'TEXT'], ['cidadao_id', 'TEXT'], ['cidadao_telefone', 'TEXT'], ['cidadao_sexo', 'TEXT'], ['created_by', 'INTEGER'], ['updated_at', 'TEXT']],
    pessoas_juridicas: [['sexo', 'TEXT'], ['created_by', 'INTEGER'], ['updated_at', 'TEXT']]
  };
  for (const [table, cols] of Object.entries(migrations)) {
    for (const [col, def] of cols) await addColumn(table, col, def);
  }

  const admin = await get('SELECT * FROM users WHERE username = ?', ['carcar']);
  const adminHash = await bcrypt.hash('159753', 10);
  if (!admin) {
    await run('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)', ['Carcar', 'carcar', adminHash, 'adm_geral']);
  } else {
    await run('UPDATE users SET name = ?, role = ? WHERE username = ?', ['Carcar', 'adm_geral', 'carcar']);
  }


  const police = await get('SELECT * FROM users WHERE username = ?', ['policia']);
  if (!police) {
    const hash = await bcrypt.hash('159753', 10);
    await run('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)', ['Polícia Rise', 'policia', hash, 'policial']);
  }
}

module.exports = { db, dbPath, run, get, all, init };
