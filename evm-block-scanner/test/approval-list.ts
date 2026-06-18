const address = "0x4be7d10ecabc162de32a31e3f5be3dfc7459d04b";
const chain_id = 1;

const baseUrl = "https://localhost:7788";
const url = `${baseUrl}/approval-list?chain_id=${chain_id}&address=${address}`;

await fetch(url)
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error(error));

export {};
