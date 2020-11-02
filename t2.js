'use strict';

/**
 * Телефонная книга
 */
const phoneBook = new Map();

const transitions = {
    'start': ['Создай', 'Удали', 'Добавь', 'Покажи'],
    'Создай': ['контакт'],
    'Удали': ['контакт', 'контакты,', 'телефон', 'почту'],
    'Добавь': ['телефон', 'почту'],
    'Покажи': ['почты', 'телефоны', 'имя'],
    'name': [';'],
    'контакт': ['name'],
    'контакты,': ['где'],
    'телефон': ['phone'],
    'почту': ['mail'],
    'phone': ['и', 'для'],
    'mail': ['и', 'для'],
    'и': ['телефон', 'почту', 'телефоны', 'почты', 'имя'],
    'для': ['контакта', 'контактов,'],
    'контакта': ['name'],
    'контактов,': ['где'],
    'почты': ['и', 'для'],
    'телефоны': ['и', 'для'],
    'имя': ['и', 'для'],
    'где': ['есть'],
    'есть': ['query'],
    'query': [';'],
    ';': ['start']
};

let needOutput = false;

let output = [];

/**
 * Вызывайте эту функцию, если есть синтаксическая ошибка в запросе
 * @param {number} lineNumber – номер строки с ошибкой
 * @param {number} charNumber – номер символа, с которого запрос стал ошибочным
 */
function syntaxError(lineNumber, charNumber) {
    throw new Error(`SyntaxError: Unexpected token at ${lineNumber}:${charNumber}`);
}

/**
 * Выполнение запроса на языке pbQL
 * @param {string} query
 * @returns {string[]} - строки с результатами запроса
 */
function run(query) {
    let state = 'start';
    let curIndex = 0;
    let startIndex = 0;
    let curCommand = 1;
    let operation = '';
    let operationStart = 0;
    let params;
    while (curIndex !== query.length) {        
        let oldState = state;
        switch (oldState) {
            case 'контакт':
            case 'контакта':
                state = 'name';
                curIndex = query.indexOf(';', startIndex);
                if (curIndex === -1) {
                    syntaxError(curCommand, query.length - query.lastIndexOf(';'));
                }
                break;
            case 'name':
            case 'query':
                startIndex -= 1;
                state = query[startIndex];
                curIndex = startIndex;
                break;
            case 'телефон':
                curIndex = query.indexOf(' ', startIndex);
                state = 'phone';
                if (!/^\d{10,10}$/.test(query.slice(startIndex, curIndex)))
                    throwSE(curCommand, startIndex, query);
                break;
            case 'почту':
                curIndex = query.indexOf(' ', startIndex);
                if (!/^\S+$/.test(query.slice(startIndex, curIndex)))
                    throwSE(curCommand, startIndex, query);
                state = 'mail';
                break;
            case 'есть':
                state = 'query';
                curIndex = query.indexOf(';', startIndex);                
                if (curIndex === -1) {                    
                    syntaxError(curCommand, query.length - query.indexOf(';', startIndex));
                }                
                break;
            case ';':                
                if (curIndex === query.length - 1) return output;
                state = 'start';                
                break;
            default:
                curIndex = query.indexOf(' ', startIndex);
                if (curIndex === -1)
                    curIndex = query.length;
                state = query.slice(startIndex, curIndex);                
                if (!transitions[oldState].includes(state))
                    throwSE(curCommand, startIndex, query);
                break;
        } 
        switch (state) {
            case 'Создай':
                operation = 'cr';
                operationStart = startIndex;
                break;
            case 'контакт':
                params = { 'name': '' };
                break;
            case 'name':
                params['name'] = query.slice(startIndex, curIndex);
                break;
            case ';':
                exec(operation, params);
                params = null;
                curCommand++;
                break;
            case 'Удали':
                operation = 'del';
                params = { 'ph': new Set(), 'ml': new Set(), 'name': '' };
                operationStart = startIndex;
                break;
            case 'контакты,':
                operation = 'delMany'
                params = { 'query': '' };
                break;
            case 'Добавь':
                operation = 'add';
                params = { 'ph': new Set(), 'ml': new Set(), 'name': '' };
                operationStart = startIndex;
                break;
            case 'phone':
                params['ph'].add(query.slice(startIndex, curIndex));
                break;
            case 'mail':
                params['ml'].add(query.slice(startIndex, curIndex));
                break;
            case 'Покажи':
                operation = 'show';
                params = { 'attr': [], 'query': '' };
                operationStart = startIndex;
                needOutput = true;
                break;
            case 'почты':
                params['attr'].push('почты');
                break;
            case 'телефоны':
                params['attr'].push('телефоны');
                break;
            case 'имя':
                params['attr'].push('имя');
                break;
            case 'query':
                params['query'] = query.slice(startIndex, curIndex);                              
                break;
        }
        startIndex = curIndex + 1;
    }    
    return output;
}

/**
 * 
 * @param { String } operation 
 * @param { Object } params 
 */
function exec(operation, params) {
    let name;
    let q;
    switch (operation) {
        case 'cr':
            createContact(params['name']);
            break;        
        case 'add':
            name = params['name'];
            for (let ph of params['ph'])
                addPhone(name, ph);
            for (let ml of params['ml'])
                addMail(name, ml);
            break;
        case 'del':
            name = params['name'];            
            if (params.hasOwnProperty('ph')) {
                for (let ph of params['ph'])
                    deletePhone(name, ph);
                for (let ml of params['ml'])
                    deleteMail(name, ml);
            }
            else                 
                deleteContact(params['name']);            
            break;
        case 'delMany':
            q = params['query'];
            if (q !== '') {
                for (let k of phoneBook.keys()) {
                    if (k.includes(q))
                        deleteContact(k);
                    else {
                        for (let ph of phoneBook.get(k)['ph'])
                            if (ph.includes(q))
                                deleteContact(k);
                        for (let ml of phoneBook.get(k)['ml'])
                            if (ml.includes(q))
                                deleteContact(k);
                    }
                }
            }
            break;
        case 'show':
            q = params['query'];
            if (q !== '') {
                for (let k of phoneBook.keys()) {
                    if (k.includes(q))
                        output.push(select(k, params['attr']));
                    else {
                        for (let ph of phoneBook.get(k)['ph'])
                            if (ph.includes(q))
                                output.push(select(k, params['attr']));
                        for (let ml of phoneBook.get(k)['ml'])
                            if (ml.includes(q))
                                output.push(select(k, params['attr']));
                    }
                }
            }
            break;
    }
}

function throwSE(curCommand, startIndex, query) {
    if (curCommand === 1)
        syntaxError(curCommand, startIndex + 1);
    else
        syntaxError(curCommand, startIndex - query.lastIndexOf(';', startIndex));
}

function createContact(name) {
    if (!phoneBook.has(name))
        phoneBook.set(name, { 'ph': new Set(), 'ml': new Set() });
}

function deleteContact(name) {    
    if (phoneBook.has(name))
        phoneBook.delete(name);
}

function addPhone(name, phone) {
    if (phoneBook.has(name))
        phoneBook.get(name)['ph'].add(phone);
}

function addMail(name, mail) {
    if (phoneBook.has(name))
        phoneBook.get(name)['ml'].add(mail);
}

function deletePhone(name, phone) {
    if (phoneBook.has(name))
        phoneBook.get(name)['ph'].delete(phone);
}

function deleteMail(name, mail) {
    if (phoneBook.has(name))
        phoneBook.get(name)['ml'].delete(mail);
}

function select(name, req) {
    let res = '';
    let attr = phoneBook.get(name);
    let wasAdded = false;
    for (let a of req) {
        switch (a) {
            case 'имя':
                res += name;
                break;
            case 'телефоны':
                wasAdded = false;
                for (let ph of attr['ph']) {
                    wasAdded = true;
                    res += `+7 (${ph.slice(0, 3)}) ${ph.slice(3, 6)}-${ph.slice(6, 8)}-${ph.slice(8)},`; 
                }
                if (wasAdded)
                    res = res.slice(0, res.length - 1);
                break;
            case 'почты':
                wasAdded = false;
                for (let ml of attr['ml']) {
                    wasAdded = true;
                    res += `${ml},`;
                }
                if (wasAdded)
                    res = res.slice(0, res.length - 1);
                break;
        }
        res += ';';
    }
    if (res[res.length - 1] === ';')
        res = res.slice(0, res.length - 1);
    return res;
}

module.exports = { phoneBook, run };