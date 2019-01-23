const mysql = require('mysql');
const config = {
    host:"207.148.77.70",
    user:"radenayr",
    password:"pa55word2018",
    database:"nodejs"
}

const pool = mysql.createPool(config);

module.exports = pool;