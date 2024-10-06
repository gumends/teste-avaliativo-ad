var MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const XLSX = require('xlsx');
require('dotenv').config();

let MONGODB_URL = process.env.MONGODB_URL;
let MONGO_DB = process.env.MONGO_DB;

const DBClient = new MongoClient(MONGODB_URL);

const DB = DBClient.db(MONGO_DB);

const processCollection = DB.collection('processo');
const userCollection = DB.collection('users');
const sectorCollection = DB.collection('setores');

let find;
try {
    find = {};
} catch (e) {
    //Caso o ouver um ID e for inválido ira retornar este erro
    console.error('ID não encontrado');
    return;
}

const dir = './resultados';
const localDir = '/parteTres';
const xlsxTransform = (results) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(results);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        if (dir) fs.mkdirSync(dir + localDir);
    } else if (!fs.existsSync(dir + localDir)) {
        fs.mkdirSync(dir + localDir);
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados');

    console.log({
        results,
        total: results.length
    });

    XLSX.writeFile(workbook, dir + '/parteTres' + `/parteTres.xlsx`);
    console.log('Resultados salvos em xls');

}

const jsonTransform = (results) => {
    console.log({
        results,
        total: results.length
    });

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        if (dir) fs.mkdirSync(dir + localDir);
    } else if (!fs.existsSync(dir + localDir)) {
        fs.mkdirSync(dir + localDir);
    }

    fs.writeFileSync(dir + localDir + '/parteTres.json', JSON.stringify({ results, total: results.length }, null, 2));
    console.log('Resultados salvos em json');
}

async function searchId(id) {
    await DBClient.connect();
    let response;
    if (id !== "Desconhecido" || id !== "Evento Automático") {
        const isUser = id.slice(0, 6) === 'auth0|'
        const search = isUser ? { id: id } : { tag: id };

        let result
        if (isUser) {
            result = await userCollection.find(search).toArray();
        } else {
            result = await sectorCollection.find(search).toArray();
        }

        for (let i = 0; i < result.length; i++) {
            response = isUser ? result[i].name : result[i].nome;
        }
    } else {
        response = id === 'Desconhecido' ? 'Desconhecido' : 'Evento Automático'
    }
    return response || id;
}

async function run() {
    await DBClient.connect();

    const findResult = await processCollection.find(find).toArray();
    if (findResult.length === 0) console.error('Nenhum processo encontrado');

    const result = findResult.map(async (process) => {
        const lastIndex = process.timeline[process.timeline.length - 1];
        return {
            'Número do Processo': process.nP,
            'Data de Criação': process.created_at,
            'Assunto do Processo': process.config_metadata.title,
            'Último Destino': lastIndex.to ?
                await searchId(lastIndex.to.userId) :
                await searchId(lastIndex.from.userId)
        }
    })

    const results = await Promise.all(result);
    const type = process.argv[2];

    if (type === '-d') {
        jsonTransform(results)
    } else if (type === '-l') {
        console.log({ results, total: results.length });
    } else {
        xlsxTransform(results)
    }

    await DBClient.close();
}

run().catch(console.dir);