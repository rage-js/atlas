async function pullCloudDatabase() {
  console.log("FETCHING (Example)");

  await new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });
}
async function pushLocalDatabase() {
  console.log("PUSHING (Example)");

  await new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });
}

export { pullCloudDatabase, pushLocalDatabase };
