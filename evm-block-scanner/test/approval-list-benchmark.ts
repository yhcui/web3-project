const address = "0x4be7d10ecabc162de32a31e3f5be3dfc7459d04b";
const chain_id = 1;

const baseUrl = "https://localhost:7788";
const url = `${baseUrl}/approval-list?chain_id=${chain_id}&address=${address}`;

await fetch(url)
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error(error));

// Benchmarking the API
console.log("Benchmarking the API");
console.log("Running 100 requests...");

for (let i = 0; i < 100; i++) {
    fetch(url)
        .catch((error) => {
            console.log(`Error: ${error} for ${i}th request`);
        })
        .then((data: any) => {
            if (data.status === 200) {
                console.log(`Request ${i}th request finished`);
            } else {
                console.log(`Error: "${data.statusText}" for ${i}th request`);
            }
        });
}
export {};
