"use strict";

var crypto = require("crypto");

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

// TODO: insert each line into blockchain
for (let line of poem) {
	createBlock(line);
}

/* Create a functon call 'createBlock'
* index: 		an incrementing number that's the 0-based position of the 
				new block within the `blocks` array; the genesis block has
				`index` of `0`, so the next block will have `index` of `1`, 
				and so on
* prevHash: 	the value of the `hash` field from the last block in the 
				`blocks` array
* data: 		the string value passed into `createBlock(..)`
* timestamp:	the numeric timestamp (from `Date.now()`) of the moment 
				the block is created
* hash: 		the SHA256 hash of the block's other fields 
				(`index`, `prevHash`, `data`, and `timestamp`)
*/
function createBlock(_data){
	let block = {
		index: 		Blockchain.blocks.length,
		prevHash: 	Blockchain.blocks[Blockchain.blocks.length-1].hash,
		data: 		_data,
		timestamp: 	Date.now()
	};
	block.hash = blockHash(block);
	Blockchain.blocks.push(block);
	console.log(block);
}

/* 
* Create a function call verifyChain that checks all blocks in the chain
* to ensure the chain is valid, and returns `true` or `false` accordingly.
*/
function verifyChain(_blockchain){
	let isValid = true;
	for (let block of _blockchain.blocks){
		isValid = verifyBlock(block);
		if(block.index > 0){
			isValid = block.prevHash === _blockchain.blocks[block.index - 1].hash;
		}
		if(!isValid){
			return isValid;
		}
	}

	return isValid;
};

/* 
* This is a recursive function call verifyChain that checks all blocks in 
* the chain and returns `true` or `false` accordingly.
*/
function verifyBlock(_block){
	let isValid = true;
	if(_block.index == 0){
		isValid = _block.hash === "000000"
				&& _block.data.length === 0 
				&& _block.index === 0;;
	}
	else{
		isValid = blockHash(_block) === _block.hash
				&& _block.prevHash.length > 0
				&& _block.data.length > 0 
				&& _block.index > 0;
	}
	return isValid;
}

console.log(`Blockchain is valid: ${verifyChain(Blockchain)}`);

 // **********************************

function blockHash(bl) {
	return crypto.createHash("sha256").update(
		// TODO: use block data to calculate hash
		`${bl.index};${bl.prevHash};${bl.data};${bl.timestamp}`
	).digest("hex");
}
