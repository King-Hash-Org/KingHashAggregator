const { deployAll } = require("./helper.ts");

const depositContract = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
const delayTime = 86400; // 1day/24hrs
const proposersArray = [
    '0x6b8caCEc8A29A356589dBAacd51C67cc4c2766ce', 
    '0xdc4f1Be190Dd581FcE03F2bF07386F0e7931160a', // derrick
    '0x381f70756098A31a52FEEf0828209EC90f65f8d2', // zou
    '0xE978A72a7367f94B1D31B0075403Ce86Be2630AE', // louis
    '0x3E29BF7B650b8910F3B4DDda5b146e8716c683a6', // dong
    '0x0000001b314273C569F5F38eE4B4CC34a3bc1404'
];
const executorsArray = ['0x6b8caCEc8A29A356589dBAacd51C67cc4c2766ce'];

async function main() {
    await deployAll(
        depositContract,
        delayTime,
        proposersArray,
        executorsArray
    );
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

export {};