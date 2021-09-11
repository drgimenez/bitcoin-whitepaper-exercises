"use strict";

var path = require("path");
var fs = require("fs");
var crypto = require("crypto");
const { Console } = require("console");

const KEYS_DIR = path.join(__dirname,"keys");
const PUB_KEY_TEXT = fs.readFileSync(path.join(KEYS_DIR,"pub.pgp.key"),"utf8");

// The Power of a Smile
// by Tupac Shakur
var poem = [
	"The power of a gun can kill",
	"and the power of fire can burn",
	"the power of wind can chill",
	"and the power of a mind can learn",
	"the power of anger can rage",
	"inside until it tears u apart",
	"but the power of a smile",
	"especially yours can heal a frozen heart",
];

const maxBlockSize = 4;
const blockFee = 5;
var difficulty = 16;

var Blockchain = {
	blocks: [],
};

// Genesis block
Blockchain.blocks.push({
	index: 0,
	hash: "000000",
	data: "",
	timestamp: Date.now(),
});

var transactionPool = [];

addPoem();
processPool();
countMyEarnings();


// **********************************

function addPoem() {
	// TODO: add lines of poem as transactions to the transaction-pool
	for(let line of poem){
		transactionPool.push(createTransaction(line));
	}
}

function processPool() {
	// TODO: process the transaction-pool in order of highest fees
	let tx;
	let txToProcess;
	let blockTransactions = {
		blockFee: {
			blockFee: blockFee,
			amount: 0,
			account: PUB_KEY_TEXT
		},
		transactions: []
	}

	while(transactionPool.length > 0){
		txToProcess = {};
		txToProcess.fee = 0;
		for(tx of transactionPool){
			if (tx.fee > txToProcess.fee){
				txToProcess = tx;
			}
		}

		transactionPool.splice(transactionPool.indexOf(txToProcess), 1);
		blockTransactions.transactions.push(txToProcess);
		blockTransactions.blockFee.amount += txToProcess.fee;
		
		if(blockTransactions.transactions.length === maxBlockSize){
			Blockchain.blocks.push(createBlock(blockTransactions));
			blockTransactions = {
				blockFee: {
					blockFee: blockFee,
					amount: 0,
					account: PUB_KEY_TEXT
				},
				transactions: []
			}
		}
	}

	if(blockTransactions.transactions.length > 0) {
		Blockchain.blocks.push(createBlock(blockTransactions));
	}
}

function countMyEarnings() {
	// TODO: count up block-fees and transaction-fees
	let totalEarnings = 0;
	let totalTransactions = 0;
	for(let block of Blockchain.blocks){
		if(block.index > 0){
			totalEarnings += block.data.blockFee.amount
						+ block.data.blockFee.blockFee;
			totalTransactions += block.data.transactions.length;

			console.log("---------------------------------------");
			console.log("Block number:", block.index);
			console.log("---------------------------------------");
			console.log(block.data.transactions);
		}
	}
	console.log("Total earnings:", totalEarnings);
	console.log("Total Blocks:", Blockchain.blocks.length);
	console.log("Total Transactions:", totalTransactions);
}

function createBlock(data) {
	var bl = {
		index: Blockchain.blocks.length,
		prevHash: Blockchain.blocks[Blockchain.blocks.length-1].hash,
		data,
		timestamp: Date.now(),
	};

	bl.hash = blockHash(bl);

	return bl;
}

function blockHash(bl) {
	while (true) {
		bl.nonce = Math.trunc(Math.random() * 1E7);
		let hash = crypto.createHash("sha256").update(
			`${bl.index};${bl.prevHash};${JSON.stringify(bl.data)};${bl.timestamp};${bl.nonce}`
		).digest("hex");

		if (hashIsLowEnough(hash)) {
			return hash;
		}
	}
}

function hashIsLowEnough(hash) {
	var neededChars = Math.ceil(difficulty / 4);
	var threshold = Number(`0b${"".padStart(neededChars * 4,"1111".padStart(4 + difficulty,"0"))}`);
	var prefix = Number(`0x${hash.substr(0,neededChars)}`);
	return prefix <= threshold;
}

function createTransaction(data) {
	var tr = {
		data,
	};

	tr.hash = transactionHash(tr);
	// Random integer from 1 to 10:
	tr.fee = Math.floor(Math.random() * 10) + 1;
	return tr;
}

function transactionHash(tr) {
	return crypto.createHash("sha256").update(
		`${JSON.stringify(tr.data)}`
	).digest("hex");
}
