const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const processInBatches = async (tasks, batchSize = 5, delayTime = 12000) => {
  let results = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((task) => task()));

    // // Debug: Log the results of each batch
    // console.log("Batch results:", batchResults);

    results = results.concat(batchResults);

    if (i + batchSize < tasks.length) {
      // Delay before the next batch
      await delay(delayTime);
    }
  }
  return results;
};

module.exports = processInBatches;
