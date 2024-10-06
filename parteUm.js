var MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
require('dotenv').config();
const XLSX = require('xlsx');

let MONGODB_URL = process.env.MONGODB_URL;
let MONGO_DB = process.env.MONGO_DB;

const DBClient = new MongoClient(MONGODB_URL);
const DB = DBClient.db(MONGO_DB);
const processCollection = DB.collection('processo');

let find;
try {
    find = {};
} catch (e) {
    //Caso o ouver um ID e for inválido ira retornar este erro
    console.error('ID não encontrado');
    return;
}

const dir = './resultados';
const localDir = '/parteUm';
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

    XLSX.writeFile(workbook, dir + '/parteUm' + `/parteUm.xlsx`);
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

    fs.writeFileSync(dir + localDir + '/parteUm.json', JSON.stringify({ results, total: results.length }, null, 2));
    console.log('Resultados salvos em json');
}

async function run() {
    await DBClient.connect();

    const findResult = await processCollection.find(find).toArray();
    if (findResult.length === 0) {
        console.error('Nenhum processo encontrado');
        await DBClient.close();
        return;
    }

    const results = findResult.map(process => {
        return {
            'Número do Protocolo': process.nP,
            'Data de Criação': process.created_at,
            'Assunto do Processo': process.config_metadata.title
        };
    });

    const type = process.argv[2];
    console.log(type);
    
    if (type === '-d') jsonTransform(results) 
    if (type === '-l') console.log({ results, total: results.length })
    if (type === undefined) xlsxTransform(results)

    await DBClient.close();
}

run().catch(console.dir);