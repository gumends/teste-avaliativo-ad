var MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const fs = require('fs');
const XLSX = require('xlsx');

let MONGODB_URL = process.env.MONGODB_URL;
let MONGO_DB = process.env.MONGO_DB;

const DBClient = new MongoClient(MONGODB_URL);

const DB = DBClient.db(MONGO_DB);

const processCollection = DB.collection('processo');
const usuarioCollection = DB.collection('users');
const setorCollection = DB.collection('setores');

let find;
try {
    find = {};
} catch (e) {
    //Caso o ouver um ID e for inválido ira retornar este erro
    console.error('ID não encontrado');
    return;
}

const dir = './resultados';
const localDir = '/parteQuatro';

const generateDir = (dir, localDir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        if (dir) fs.mkdirSync(dir + localDir);
    } else if (!fs.existsSync(dir + localDir)) {
        fs.mkdirSync(dir + localDir);
    }
}

const xlsxTransform = (results) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(results);

    generateDir(dir, localDir);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados');

    console.log({
        results,
        total: results.length
    });

    XLSX.writeFile(workbook, dir + '/parteQuatro' + `/parteQuatro.xlsx`);
    console.log('Resultados salvos em xls');

}

const jsonTransform = (results) => {
    console.log({
        results,
        total: results.length
    });

    generateDir(dir, localDir);

    fs.writeFileSync(dir + localDir + '/parteQuatro.json', JSON.stringify({ results, total: results.length }, null, 2));
    console.log('Resultados salvos em json');
}

async function buscaId(id) {
    await DBClient.connect();

    const isUser = id.slice(0, 6) === 'auth0|'
    const busca = isUser ? { id: id } : { tag: id };

    let result
    if (isUser) {
        result = await usuarioCollection.find(busca).toArray();
    } else {
        result = await setorCollection.find(busca).toArray();
    }

    for (let i = 0; i < result.length; i++) {
        return isUser ? result[i].name : result[i].nome;
    }
}

async function run() {
    await DBClient.connect();

    const findResult = await processCollection.find(find).toArray();
    if (findResult.length === 0) console.error('Nenhum processo encontrado');

    const result = findResult.map(async (process) => {
        const lastEvent = await process.timeline[process.timeline.length - 1];
        const data = {
            'Número do Protocolo': process.nP,
            'Data de Criação': process.created_at,
            'Assunto do processo': process.config_metadata.title,
            'Último Evento': lastEvent.data.action,
        }

        let lastUser;
        let lastSector;

        for (let i = process.timeline.length - 1; i >= 0 && (!lastSector || !lastUser); i--) {
            const evento = process.timeline[i];
            if (evento.to) {
                if (evento.to.userId.slice(0, 6) === 'auth0|') {
                    if (!lastUser) { lastUser = await buscaId(evento.to.userId); }
                } else {
                    if (!lastSector) { lastSector = await buscaId(evento.to.userId); }
                }
            }
            if (evento.from) {
                if (evento.from.userId.slice(0, 6) === 'auth0|') {
                    if (!lastUser) { lastUser = await buscaId(evento.from.userId); }
                } else {
                    if (!lastSector) { lastSector = await buscaId(evento.from.userId); }
                }
            }
        }
        data['Último Setor'] = lastSector || null;
        data['Último Usuário'] = lastUser || null;
        return data;
    });

    const results = await Promise.all(result);
    const type = process.argv[2];

    if (type === '-d') jsonTransform(results)
    if (type === '-l') console.log({ results, total: results.length })
    if (type === undefined) xlsxTransform(results)

    await DBClient.close();
}

run().catch(console.dir);