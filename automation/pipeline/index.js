#!/usr/bin/env node
/**
 * Pipeline Orchestrator
 * - Runs collector -> generator -> publisher sequentially.
 */

const { runCollector } = require('../collector');
const { runGenerator } = require('../generator');
const { runPublisher } = require('../publisher');

const main = async () => {
  const collectorResult = await runCollector();
  const generatorResult = await runGenerator();
  const status = await runPublisher({
    collectorResult,
    generatorResult,
  });

  console.log('Pipeline completed.');
  console.log(JSON.stringify(status, null, 2));
};

main().catch((error) => {
  console.error('Pipeline failed:', error);
  process.exit(1);
});
