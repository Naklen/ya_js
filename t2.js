'use strict';

/**
 * Телефонная книга
 */
const phoneBook = new Map();

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
    return [];
}

function createContact(name) {
    if (!phoneBook.has(name))
        phoneBook.set(name, { 'ph': new Set(), 'ml': new Set()});
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

module.exports = { phoneBook, run };