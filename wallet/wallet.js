"use strict";

var path = require("path");
var fs = require("fs");

var Blockchain = require(path.join(__dirname,"blockchain.js"));

const KEYS_DIR = path.join(__dirname,"keys");
const PRIV_KEY_TEXT_1 = fs.readFileSync(path.join(KEYS_DIR,"1.priv.pgp.key"),"utf8");
const PUB_KEY_TEXT_1 = fs.readFileSync(path.join(KEYS_DIR,"1.pub.pgp.key"),"utf8");
const PRIV_KEY_TEXT_2 = fs.readFileSync(path.join(KEYS_DIR,"2.priv.pgp.key"),"utf8");
const PUB_KEY_TEXT_2 = fs.readFileSync(path.join(KEYS_DIR,"2.pub.pgp.key"),"utf8");

var wallet = {
	accounts: {},
};

addAccount(PRIV_KEY_TEXT_1,PUB_KEY_TEXT_1);
addAccount(PRIV_KEY_TEXT_2,PUB_KEY_TEXT_2);

// fake an initial balance in account #1
wallet.accounts[PUB_KEY_TEXT_1].outputs.push(
	{
		account: PUB_KEY_TEXT_1,
		amount: 42,
	}
);

main().catch(console.log);


// **********************************

async function main() {
	console.log("------------------------------");
	console.log("First transaction 1-2");
	console.log("Amount", 13);
	console.log("------------------------------");
	console.log("From balance before:", accountBalance(PUB_KEY_TEXT_1));
	console.log("To balance before:", accountBalance(PUB_KEY_TEXT_2));
	await spend(
		/*from=*/wallet.accounts[PUB_KEY_TEXT_1],
		/*to=*/wallet.accounts[PUB_KEY_TEXT_2],
		/*amount=*/13
	);
	console.log("------------------------------");
	console.log("From balance after:", accountBalance(PUB_KEY_TEXT_1));
	console.log("To balance after:", accountBalance(PUB_KEY_TEXT_2));
	console.log("------------------------------");

	console.log("------------------------------");
	console.log("Second transaction 2-1");
	console.log("Amount", 5);
	console.log("------------------------------");
	console.log("From balance before:", accountBalance(PUB_KEY_TEXT_1));
	console.log("To balance before:", accountBalance(PUB_KEY_TEXT_2));
	await spend(
		/*from=*/wallet.accounts[PUB_KEY_TEXT_2],
		/*to=*/wallet.accounts[PUB_KEY_TEXT_1],
		/*amount=*/5
	);
	console.log("------------------------------");
	console.log("From balance after:", accountBalance(PUB_KEY_TEXT_1));
	console.log("To balance after:", accountBalance(PUB_KEY_TEXT_2));
	console.log("------------------------------");

	console.log("------------------------------");
	console.log("Third transaction 1-2");
	console.log("Amount", 31);
	console.log("------------------------------");
	console.log("From balance before:", accountBalance(PUB_KEY_TEXT_1));
	console.log("To balance before:", accountBalance(PUB_KEY_TEXT_2));
	await spend(
		/*from=*/wallet.accounts[PUB_KEY_TEXT_1],
		/*to=*/wallet.accounts[PUB_KEY_TEXT_2],
		/*amount=*/31
	);
	console.log("------------------------------");
	console.log("From balance after:", accountBalance(PUB_KEY_TEXT_1));
	console.log("To balance after:", accountBalance(PUB_KEY_TEXT_2));
	console.log("------------------------------");

	console.log("------------------------------");
	console.log("fourth transaction 2-1");
	console.log("Amount", 40);
	console.log("------------------------------");
	console.log("From balance before:", accountBalance(PUB_KEY_TEXT_1));
	console.log("To balance before:", accountBalance(PUB_KEY_TEXT_2));
	try {
		await spend(
			/*from=*/wallet.accounts[PUB_KEY_TEXT_2],
			/*to=*/wallet.accounts[PUB_KEY_TEXT_1],
			/*amount=*/40
		);
	}
	catch (err) {
		console.log(err);
	}
	console.log("------------------------------");
	console.log("From balance after:", accountBalance(PUB_KEY_TEXT_1));
	console.log("To balance after:", accountBalance(PUB_KEY_TEXT_2));
	console.log("------------------------------");

	console.log("accountBalance(PUB_KEY_TEXT_1):", accountBalance(PUB_KEY_TEXT_1));
	console.log("accountBalance(PUB_KEY_TEXT_2):", accountBalance(PUB_KEY_TEXT_2));
	console.log("------------------------------------------------------");
	console.log("Block count:", Blockchain.chain.blocks.length);
	console.log("Blockchain.verifyChain:", await Blockchain.verifyChain(Blockchain.chain));
}

function addAccount(privKey,pubKey) {
	wallet.accounts[pubKey] = {
		privKey,
		pubKey,
		outputs: []
	};
}

async function spend(fromAccount,toAccount,amountToSpend) {
	// TODO
	var trData = {
		inputs: [],
		outputs: [],
	};
	
	// pick inputs to use from fromAccount's outputs (i.e. previous txns, see line 22), sorted descending
	var sortedInputs = [];
	let anOutput;
	let inputAmounts = 0;
	let fromAccountOutputsBackups = fromAccount.outputs.slice();
	
	while(fromAccount.outputs[0] != undefined && inputAmounts < amountToSpend){
		anOutput = {};
		anOutput.amount = 0;
		for(let output of fromAccount.outputs){
			if(output.amount > anOutput.amount){
				anOutput = output;
			}
		}

		fromAccount.outputs.splice(fromAccount.outputs.indexOf(anOutput), 1);
		let newImput = {};
		newImput.account = anOutput.account;
		newImput.amount = anOutput.amount;
		sortedInputs.push(newImput);
		inputAmounts += anOutput.amount;
	}
	
	// for (let input of sortedInputs) {
	// 	// remove input from output-list
	// 	// do we have enough inputs to cover the spent amount?
	// }

	if (inputAmounts < amountToSpend) {
		fromAccount.outputs = fromAccountOutputsBackups.slice();
		console.log("Account balance of sender account:", accountBalance(fromAccount.pubKey))
		console.log("Account balance of recipient account:", accountBalance(toAccount.pubKey))
		throw `Don't have enough to spend ${amountToSpend}!`;
	}	

	// sign and record inputs
	for (let input of sortedInputs){
		trData.inputs.push(await Blockchain.authorizeInput(input, fromAccount.privKey));
	}
	
	// record output
	let output_1 = {
		account: toAccount.pubKey,
		amount: amountToSpend,
	}
	trData.outputs.push(output_1);
	
	// is "change" output needed?
	if(inputAmounts > amountToSpend){
		let output_2 = {
			account: fromAccount.pubKey,
			amount: inputAmounts - amountToSpend,
		}
		trData.outputs.push(output_2);
	}

	// create transaction and add it to blockchain
	var tr = Blockchain.createTransaction(trData);
	Blockchain.insertBlock(
		// TODO .createBlock method
		Blockchain.createBlock([tr])
	);	
	
	// record outputs in our wallet (if needed)	
	for (let output of trData.outputs) {
		if (output.account in wallet.accounts) {
			wallet.accounts[output.account].outputs.push(output);
		}
	}
}

function accountBalance(account) {
	var balance = 0;
	if (account in wallet.accounts) {
		for(let output of wallet.accounts[account].outputs){

			balance += output.amount;
		}
	}	
	
	return balance;
	
}
